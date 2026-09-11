# Сайт bclearlab.ru на Timeweb Cloud (App Platform, деплой через Dockerfile).
# nginx отдаёт статичные страницы так же, как GitHub Pages: подробности в nginx.conf.
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html

EXPOSE 80
