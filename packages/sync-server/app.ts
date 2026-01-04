import { run as runMigrations } from './src/migrations';

runMigrations()
  .then(() => {
    //import the app here becasue initial migrations need to be run first - they are dependencies of the app.js
    // Use no extension - loader will resolve to .ts in debug mode, TypeScript will compile to .js in production
    import('./src/app').then(app => app.run()); // run the app
  })
  .catch(err => {
    console.log('Error starting app:', err);
    process.exit(1);
  });
