from abc import ABC, abstractmethod
from typing import Generic, TypeVar
from pydantic import BaseModel


class Command(BaseModel):
    """Marca de escritura: muta estado en Redis y/o MongoDB."""
    pass


class Query(BaseModel):
    """Marca de lectura: no muta estado, devuelve proyecciones."""
    pass


TCommand = TypeVar("TCommand", bound=Command)
TQuery = TypeVar("TQuery", bound=Query)
TResult = TypeVar("TResult")


class CommandHandler(ABC, Generic[TCommand, TResult]):
    @abstractmethod
    async def handle(self, command: TCommand) -> TResult:
        ...


class QueryHandler(ABC, Generic[TQuery, TResult]):
    @abstractmethod
    async def handle(self, query: TQuery) -> TResult:
        ...
