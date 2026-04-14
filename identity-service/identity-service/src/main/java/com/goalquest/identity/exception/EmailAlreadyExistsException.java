package com.goalquest.identity.exception;

public class EmailAlreadyExistsException extends RuntimeException {
    public EmailAlreadyExistsException() {
        super("El email ya está registrado");
    }
}
