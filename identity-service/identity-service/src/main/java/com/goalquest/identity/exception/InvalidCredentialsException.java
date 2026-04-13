package com.goalquest.identity.exception;

public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException() {
        super("Email o contraseña incorrectos");
    }
}
