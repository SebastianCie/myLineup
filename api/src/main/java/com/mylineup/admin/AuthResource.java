package com.mylineup.admin;

import io.quarkus.elytron.security.common.BcryptUtil;
import io.smallrye.jwt.build.Jwt;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Set;

@Path("/api/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AuthResource {

    public record RegisterRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, message = "Passwort muss mindestens 8 Zeichen haben") String password,
            @NotBlank String name) {
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {
    }

    public record AuthResponse(String token, String email, String name) {
    }

    @POST
    @Path("/register")
    @Transactional
    public Response register(@Valid RegisterRequest req) {
        if (Admin.findByEmail(req.email()) != null) {
            return Response.status(Response.Status.CONFLICT)
                    .entity(new ErrorResponse("E-Mail ist bereits registriert"))
                    .build();
        }

        Admin admin = new Admin();
        admin.email = req.email();
        admin.name = req.name();
        admin.passwordHash = BcryptUtil.bcryptHash(req.password());
        admin.persist();

        String token = issueToken(admin);
        return Response.status(Response.Status.CREATED)
                .entity(new AuthResponse(token, admin.email, admin.name))
                .build();
    }

    @POST
    @Path("/login")
    public Response login(@Valid LoginRequest req) {
        Admin admin = Admin.findByEmail(req.email());
        if (admin == null || !BcryptUtil.matches(req.password(), admin.passwordHash)) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new ErrorResponse("E-Mail oder Passwort ist falsch"))
                    .build();
        }

        String token = issueToken(admin);
        return Response.ok(new AuthResponse(token, admin.email, admin.name)).build();
    }

    private String issueToken(Admin admin) {
        return Jwt.subject(String.valueOf(admin.id))
                .upn(admin.email)
                .claim("name", admin.name)
                .groups(Set.of("admin"))
                .sign();
    }

    public record ErrorResponse(String message) {
    }
}
