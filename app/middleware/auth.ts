import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { request } from "http";

const protectedPaths = ['/admin', '/dashboard'];

export async function middleware(req : NextRequest) {
    const token = await getToken({req : request, secret : process.env.JWT_SECRET});

    const isAuthenticated = !!token;
    const hasRequiredRole = token?.role === 'admin';

    const pathname = req.nextUrl.pathname;

    if(protectedPaths.some((path) => pathname.startsWith(path)) && (!isAuthenticated)) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url.toString());
    }

    return NextResponse.next();
}

export const config = {
    matcher : ['admin', 'dashboard', '/((?!api|_next/static|_next/image|favicon.ico).*)'],
};