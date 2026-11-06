#!/bin/sh
# Stops the deploy if anything the site needs is missing.
ok=1
for f in assets/images/instax/01-station.jpg assets/images/instax/02-stone-wall.jpg assets/images/instax/03-desk.jpg \
         index.html favicon.ico favicon.svg assets/og/og-image-1200x630.png .vercel/project.json; do
  [ -f "$f" ] || { echo "MISSING: $f"; ok=0; }
done
[ $ok = 1 ] && echo "All files present — ready to deploy." || { echo "Add the missing files, then run this check again."; exit 1; }
