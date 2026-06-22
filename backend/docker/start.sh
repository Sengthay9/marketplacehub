#!/bin/sh
set -e

cd /var/www/html

php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan migrate --force

chown -R www-data:www-data storage bootstrap/cache

exec /usr/bin/supervisord -c /etc/supervisord.conf
