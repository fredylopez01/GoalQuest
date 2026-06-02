from app.cqrs.base import Command


class CreateProfileCommand(Command):
    user_id: str
