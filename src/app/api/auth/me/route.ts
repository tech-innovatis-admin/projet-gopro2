import { NextResponse } from 'next/server';
import { getAuthPayload } from '../../../../lib/jwt';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    console.log('[AuthMe] Verificando autenticação do usuário...');
    const payload = await getAuthPayload();
    
    console.log('[AuthMe] Payload obtido:', payload ? { email: payload.email, exp: payload.exp, type: payload.type } : null);
    
    if (!payload) {
      console.log('[AuthMe] Usuário não autenticado');
      return NextResponse.json(
        { isAuthenticated: false },
        { status: 200 }
      );
    }
    
    // Buscar usuário no banco e verificar se ainda tem acesso ao Gopro (projetos) -
    const user = await prisma.users.findFirst({
      where: {
        AND: [
          { email: payload.email },
          { platforms: { has: 'projetos' } }
        ]
      }
    });
    
    if (!user) {
      console.log('[AuthMe] Usuário não encontrado ou acesso revogado');
      return NextResponse.json(
        { isAuthenticated: false },
        { status: 200 }
      );
    }
    
    console.log('[AuthMe] Usuário autenticado:', payload.email);
    return NextResponse.json({
      isAuthenticated: true,
      user: {
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[AuthMe] Erro ao verificar autenticação:', error);
    return NextResponse.json(
      { isAuthenticated: false, error: 'Erro ao verificar autenticação' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
