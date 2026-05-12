import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class UsersService {
  private transporter: nodemailer.Transporter;

  constructor(
    private supabase: SupabaseService,
    private config: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.config.get('EMAIL_USER'),
        pass: this.config.get('EMAIL_PASS'),
      },
    });
  }

  async register(dto: {
    name: string; last_name: string; email: string;
    dni: string; address: string; phone: string; password: string;
  }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const { data, error } = await this.supabase.db
      .from('users')
      .insert([{
        name: dto.name, last_name: dto.last_name, email: dto.email,
        dni: dto.dni, address: dto.address, phone: dto.phone,
        password: hashedPassword, role: 'user',
        email_verified: false, verification_token: verificationToken,
      }])
      .select();
    if (error) throw error;

    const verifyUrl = `http://localhost:3000/verify-email?token=${verificationToken}`;
    await this.transporter.sendMail({
      from: `"El Bazar del Coleccionista" <${this.config.get('EMAIL_USER')}>`,
      to: dto.email,
      subject: 'VERIFICAR_EMAIL.EXE — El Bazar del Coleccionista',
      html: `<div style="font-family:'Courier New',monospace;background:#f4ecd8;padding:2rem;border:2px solid #000;max-width:500px;">
        <div style="background:#000080;color:#fff;padding:5px 10px;margin-bottom:1.5rem;font-weight:bold;">VERIFICAR_EMAIL.EXE</div>
        <p>Hola <strong>${dto.name}</strong>,</p>
        <p>Gracias por registrarte en El Bazar del Coleccionista.</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#90ee90;border:2px solid #000;padding:10px 20px;text-decoration:none;color:#000;font-weight:bold;margin-top:1rem;">[OK] VERIFICAR MI CUENTA</a>
      </div>`,
    });

    return { message: 'Registro completado. Verifica tu email.' };
  }

  async verifyEmail(token: string) {
    const { data: user, error } = await this.supabase.db
      .from('users').select('*').eq('verification_token', token).single();
    if (error || !user) throw new Error('Token inválido');

    await this.supabase.db
      .from('users')
      .update({ email_verified: true, verification_token: null })
      .eq('id', user.id);

    return { message: 'Email verificado correctamente' };
  }

  async login(email: string, password: string) {
    const { data: user, error } = await this.supabase.db
      .from('users').select('*').eq('email', email).single();
    if (error || !user) throw new Error('Usuario no encontrado');
    if (!user.email_verified) throw new Error('UNVERIFIED');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Contraseña incorrecta');
    return user;
  }

  async findAll(email?: string, dni?: string) {
    let query = this.supabase.db.from('users').select('*');
    if (email) query = query.eq('email', email);
    if (dni) query = query.eq('dni', dni);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async findPublic(id: string) {
    const { data, error } = await this.supabase.db
      .from('users')
      .select('id, name, last_name, role, created_at')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase.db
      .from('users').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  }

  async update(id: string, dto: { name: string; last_name: string; address: string; phone: string; email: string; dni: string }) {
    const { data, error } = await this.supabase.db
      .from('users').update(dto).eq('id', id).select();
    if (error) throw error;
    return data[0];
  }

  async forgotPassword(email: string) {
    const { data: user, error } = await this.supabase.db
      .from('users').select('*').eq('email', email).single();
    if (error || !user) throw new Error('Email no encontrado');

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);

    await this.supabase.db
      .from('users')
      .update({ reset_token: token, reset_token_expires: expires })
      .eq('id', user.id);

    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
    await this.transporter.sendMail({
      from: `"El Bazar del Coleccionista" <${this.config.get('EMAIL_USER')}>`,
      to: email,
      subject: 'RECUPERAR_CONTRASEÑA.EXE — El Bazar del Coleccionista',
      html: `<div style="font-family:'Courier New',monospace;background:#f4ecd8;padding:2rem;border:2px solid #000;max-width:500px;">
        <div style="background:#000080;color:#fff;padding:5px 10px;margin-bottom:1.5rem;font-weight:bold;">RECUPERAR_CONTRASEÑA.EXE</div>
        <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#90ee90;border:2px solid #000;padding:10px 20px;text-decoration:none;color:#000;font-weight:bold;margin-top:1rem;">[>>>] RESTABLECER CONTRASEÑA</a>
      </div>`,
    });

    return { message: 'Enlace enviado' };
  }

  async resetPassword(token: string, password: string) {
    const { data: user, error } = await this.supabase.db
      .from('users').select('*').eq('reset_token', token).single();
    if (error || !user) throw new Error('Token inválido');
    if (new Date(user.reset_token_expires) < new Date()) throw new Error('Token expirado');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await this.supabase.db
      .from('users')
      .update({ password: hashedPassword, reset_token: null, reset_token_expires: null })
      .eq('id', user.id);

    return { message: 'Contraseña actualizada' };
  }
}
