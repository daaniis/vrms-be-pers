/* eslint-disable prettier/prettier */
import { Injectable, NestMiddleware } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "./config/config.service";

@Injectable()
export class UserMiddleware implements NestMiddleware {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}

    async use(req: any, res: any, next: () => void) {
        const authHeader = req.headers?.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split('')[1];
            try {
                const decodedToken = await this.jwtService.verify(token, {
                    secret: this.configService.JWT_SECRET,
                });
                req.user = decodedToken;
            } catch (error) {
                console.error('Error: ', error);
            }
        }
        next();
    }
}