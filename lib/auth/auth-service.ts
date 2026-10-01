import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma";

export type UserRole = "CUSTOMER" | "MERCHANT" | "ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  role: UserRole;
  shopId?: string | null;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "digital-kirana-enterprise-secret-key-2026-secure";

// In-Memory Users store for zero-setup environment
const inMemoryUsers: (AuthUser & { passwordHash: string })[] = [
  {
    id: "user-merchant-01",
    name: "Ramesh Sharma (Store Owner)",
    mobile: "+91 98351 24567",
    email: "sharma.kirana@eko.in",
    role: "MERCHANT",
    shopId: "shop-default-01",
    passwordHash: bcrypt.hashSync("admin123", 10),
  },
  {
    id: "user-customer-01",
    name: "Rahul Kumar",
    mobile: "+91 98351 10293",
    email: "rahul.kumar@gmail.com",
    role: "CUSTOMER",
    shopId: null,
    passwordHash: bcrypt.hashSync("customer123", 10),
  },
];

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(user: AuthUser): string {
    return jwt.sign(
      {
        sub: user.id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        shopId: user.shopId,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
  }

  static verifyToken(token: string): AuthUser | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return {
        id: decoded.sub,
        name: decoded.name,
        mobile: decoded.mobile,
        email: decoded.email,
        role: decoded.role,
        shopId: decoded.shopId,
      };
    } catch (e) {
      return null;
    }
  }

  static async login(mobileOrEmail: string, password: string): Promise<AuthSession | null> {
    const cleanId = mobileOrEmail.trim().toLowerCase();

    try {
      if (process.env.DATABASE_URL) {
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { mobile: cleanId },
              { email: cleanId },
            ],
          },
        });

        if (user) {
          const isValid = await this.comparePassword(password, user.passwordHash);
          if (isValid) {
            const authUser: AuthUser = {
              id: user.id,
              name: user.name,
              mobile: user.mobile,
              email: user.email,
              role: user.role as UserRole,
              shopId: user.shopId,
            };
            return {
              user: authUser,
              token: this.generateToken(authUser),
            };
          }
        }
      }
    } catch (e) {
      console.warn("Prisma login fallback:", e);
    }

    // In-Memory Fallback
    const found = inMemoryUsers.find(
      (u) => u.mobile.includes(cleanId) || (u.email && u.email.toLowerCase() === cleanId)
    );

    if (found && (await this.comparePassword(password, found.passwordHash))) {
      const authUser: AuthUser = {
        id: found.id,
        name: found.name,
        mobile: found.mobile,
        email: found.email,
        role: found.role,
        shopId: found.shopId,
      };
      return {
        user: authUser,
        token: this.generateToken(authUser),
      };
    }

    return null;
  }

  static async register(input: {
    name: string;
    mobile: string;
    password: string;
    role?: UserRole;
    email?: string;
  }): Promise<AuthSession> {
    const passwordHash = await this.hashPassword(input.password);
    const role = input.role || "CUSTOMER";

    try {
      if (process.env.DATABASE_URL) {
        const created = await prisma.user.create({
          data: {
            name: input.name,
            mobile: input.mobile,
            email: input.email || null,
            passwordHash,
            role: role as any,
          },
        });

        const authUser: AuthUser = {
          id: created.id,
          name: created.name,
          mobile: created.mobile,
          email: created.email,
          role: created.role as UserRole,
          shopId: created.shopId,
        };

        return {
          user: authUser,
          token: this.generateToken(authUser),
        };
      }
    } catch (e) {
      console.warn("Prisma register fallback:", e);
    }

    // In-memory fallback
    const newUser: AuthUser & { passwordHash: string } = {
      id: `usr-${Date.now()}`,
      name: input.name,
      mobile: input.mobile,
      email: input.email || null,
      role,
      shopId: null,
      passwordHash,
    };

    inMemoryUsers.push(newUser);

    const authUser: AuthUser = {
      id: newUser.id,
      name: newUser.name,
      mobile: newUser.mobile,
      email: newUser.email,
      role: newUser.role,
      shopId: newUser.shopId,
    };

    return {
      user: authUser,
      token: this.generateToken(authUser),
    };
  }
}
