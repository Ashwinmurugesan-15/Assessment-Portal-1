const bcrypt = require('bcryptjs');

const password = 'admin123';
const hash = '$2a$10$rN8qKZHxqGKJwGwP5VxZVOYvKX3p7KlZqV5qFZqVZqVZqVZqVZqVZ';

console.log(`Password: ${password}`);
console.log(`Hash: ${hash}`);

bcrypt.compare(password, hash).then((res) => {
    console.log(`Match? ${res}`);
});
