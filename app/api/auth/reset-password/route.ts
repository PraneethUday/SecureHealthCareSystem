import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const { token, email, password } = await request.json();

        if (!token || !email || !password) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        console.log('[Reset Password] Processing request for:', email);

        // Lazy initialization of Supabase client inside handler
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('[Reset Password] Missing Supabase configuration');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Hash the token to compare with stored hash
        const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with matching token and email
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, email, reset_token, reset_token_expiry')
            .eq('email', email)
            .eq('reset_token', resetTokenHash)
            .single();

        if (userError || !user) {
            console.log('[Reset Password] Invalid token or email');
            return NextResponse.json(
                { error: 'Invalid or expired reset link' },
                { status: 400 }
            );
        }

        // Check if token has expired
        const tokenExpiry = new Date(user.reset_token_expiry);
        if (tokenExpiry < new Date()) {
            console.log('[Reset Password] Token expired');
            return NextResponse.json(
                { error: 'Reset link has expired. Please request a new one.' },
                { status: 400 }
            );
        }

        // Validate password strength
        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user's password and clear reset token
        const { error: updateError } = await supabase
            .from('users')
            .update({
                password: hashedPassword,
                reset_token: null,
                reset_token_expiry: null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('[Reset Password] Error updating password:', updateError);
            return NextResponse.json(
                { error: 'Failed to reset password' },
                { status: 500 }
            );
        }

        console.log('[Reset Password] ✅ Password reset successful for:', email);

        return NextResponse.json({
            success: true,
            message: 'Password reset successful',
        });
    } catch (error: any) {
        console.error('[Reset Password] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
