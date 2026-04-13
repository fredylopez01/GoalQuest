package com.goalquest.identity.exception;

public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String id) {
        super("Usuario no encontrado: " + id);
    }
}
