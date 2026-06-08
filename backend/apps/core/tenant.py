"""
Contexto del tenant actual usando un almacenamiento por hilo (thread-local).
El middleware fija el tenant al inicio de cada petición y lo limpia al final.
"""
import threading

_state = threading.local()


def set_current_tenant(tenant):
    _state.tenant = tenant


def get_current_tenant():
    return getattr(_state, "tenant", None)


def clear_current_tenant():
    _state.tenant = None
