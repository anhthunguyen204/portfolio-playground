# Deploy to thunguyen-uxdesign.vercel.app

`.vercel/project.json` links this folder to the existing Vercel project
(claude-design-4523a9accaef1478606a6b31c62765b5). No new project is created and the domain is unchanged.

1. Copy the three Instax photos into `assets/images/instax/`:
   01-station.jpg, 02-stone-wall.jpg, 03-desk.jpg
2. Check:            sh check-before-deploy.sh
3. Preview (safe):   npx vercel deploy
4. Production:       npx vercel deploy --prod

If the CLI asks you to log in, run `npx vercel login` first.
