import { NextRequest, NextResponse } from 'next/server';

// Mock user for development
const MOCK_USER = {
  username: 'admin',
  email: 'admin@gopro.local',
  password: '123',
  name: 'Administrador',
  id: '1',
  role: 'admin',
};

// Simple token generation for dev
function generateToken(userId: string): string {
  const payload = { userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }; // 7 days
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    console.log('🔐 [Login] Tentativa com identifier:', identifier);

    // Validação básica
    if (!identifier || !password) {
      console.log('❌ [Login] Faltam credenciais');
      return NextResponse.json(
        { error: 'Email ou usuário e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Mock authentication - accepts username or email
    const isValidUser =
      (identifier === MOCK_USER.username || identifier === MOCK_USER.email) &&
      password === MOCK_USER.password;

    if (!isValidUser) {
      console.log('❌ [Login] Credenciais inválidas');
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    console.log('✅ [Login] Usuário autenticado:', MOCK_USER.email);

    // Gera token
    const token = generateToken(MOCK_USER.id);

    // Cria resposta com cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: MOCK_USER.id,
          name: MOCK_USER.name,
          email: MOCK_USER.email,
          role: MOCK_USER.role,
        },
      },
      { status: 200 }
    );

    // Define cookie httpOnly para segurança
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 dias em segundos
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('⚠️ [Login] Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
