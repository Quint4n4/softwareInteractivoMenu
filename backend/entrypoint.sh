#!/bin/sh
set -e

# Esperar a que Postgres esté listo
if [ "$DB_ENGINE" = "postgres" ]; then
  echo "Esperando a Postgres en $DB_HOST:$DB_PORT ..."
  until nc -z "$DB_HOST" "${DB_PORT:-5432}"; do
    sleep 0.5
  done
  echo "Postgres listo."
fi

python manage.py migrate --noinput

# En desarrollo usamos runserver (autoreload). Para producción, cambiar a:
#   gunicorn config.wsgi:application --bind 0.0.0.0:8000
if [ "$DJANGO_DEBUG" = "False" ]; then
  exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
else
  exec python manage.py runserver 0.0.0.0:8000
fi
