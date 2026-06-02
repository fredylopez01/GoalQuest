from typing import Dict, Type
from app.cqrs.base import Command, Query, CommandHandler, QueryHandler


class CommandBus:
    def __init__(self) -> None:
        self._handlers: Dict[Type[Command], CommandHandler] = {}

    def register(self, command_type: Type[Command], handler: CommandHandler) -> None:
        if command_type in self._handlers:
            raise RuntimeError(
                f"Handler ya registrado para el comando {command_type.__name__}"
            )
        self._handlers[command_type] = handler

    async def dispatch(self, command: Command):
        handler = self._handlers.get(type(command))
        if handler is None:
            raise RuntimeError(
                f"No hay handler registrado para el comando {type(command).__name__}"
            )
        return await handler.handle(command)


class QueryBus:
    def __init__(self) -> None:
        self._handlers: Dict[Type[Query], QueryHandler] = {}

    def register(self, query_type: Type[Query], handler: QueryHandler) -> None:
        if query_type in self._handlers:
            raise RuntimeError(
                f"Handler ya registrado para la query {query_type.__name__}"
            )
        self._handlers[query_type] = handler

    async def dispatch(self, query: Query):
        handler = self._handlers.get(type(query))
        if handler is None:
            raise RuntimeError(
                f"No hay handler registrado para la query {type(query).__name__}"
            )
        return await handler.handle(query)


command_bus = CommandBus()
query_bus = QueryBus()
