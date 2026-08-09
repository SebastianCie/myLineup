package com.mylineup.participant;

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

@Path("/api/participant/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ParticipantAuthResource {

    public record RegisterRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, message = "Passwort muss mindestens 8 Zeichen haben") String password,
            @NotBlank String name) {
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {
    }

    public record AuthResponse(String token, String email, String name) {
    }

    public record ErrorResponse(String message) {
    }

    @POST
    @Path("/register")
    @Transactional
    public Response register(@Valid RegisterRequest req) {
        if (Participant.findByEmail(req.email()) != null) {
            return Response.status(Response.Status.CONFLICT)
                    .entity(new ErrorResponse("E-Mail ist bereits registriert"))
                    .build();
        }

        Participant participant = new Participant();
        participant.email = req.email();
        participant.name = req.name();
        participant.passwordHash = BcryptUtil.bcryptHash(req.password());
        participant.persist();

        String token = issueToken(participant);
        return Response.status(Response.Status.CREATED)
                .entity(new AuthResponse(token, participant.email, participant.name))
                .build();
    }

    @POST
    @Path("/login")
    public Response login(@Valid LoginRequest req) {
        Participant participant = Participant.findByEmail(req.email());
        if (participant == null || !BcryptUtil.matches(req.password(), participant.passwordHash)) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new ErrorResponse("E-Mail oder Passwort ist falsch"))
                    .build();
        }

        String token = issueToken(participant);
        return Response.ok(new AuthResponse(token, participant.email, participant.name)).build();
    }

    private String issueToken(Participant participant) {
        return Jwt.subject(String.valueOf(participant.id))
                .upn(participant.email)
                .claim("name", participant.name)
                .groups(Set.of("participant"))
                .sign();
    }
}
