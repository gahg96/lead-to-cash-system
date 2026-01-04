import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        username: string;
        passwordHash: string;
        displayName: string;
        role: import("@prisma/client").$Enums.UserRole;
        email: string | null;
    }[]>;
    create(createUserDto: CreateUserDto): Promise<{
        id: string;
        createdAt: Date;
        username: string;
        passwordHash: string;
        displayName: string;
        role: import("@prisma/client").$Enums.UserRole;
        email: string | null;
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        id: string;
        createdAt: Date;
        username: string;
        passwordHash: string;
        displayName: string;
        role: import("@prisma/client").$Enums.UserRole;
        email: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        username: string;
        passwordHash: string;
        displayName: string;
        role: import("@prisma/client").$Enums.UserRole;
        email: string | null;
    }>;
}
