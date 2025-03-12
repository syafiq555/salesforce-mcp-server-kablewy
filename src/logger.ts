import { createLogger, format, transports } from 'winston';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports: [
        new transports.File({ filename: path.join(__dirname, 'logs', 'app.log'), level: 'info' }),
        new transports.Console({ format: format.simple() })
    ],
});

export default logger; 