# Use the official Node.js image as the base image
FROM node:alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Copy prisma folder to the working directory
COPY prisma ./prisma/

# Copy .env file to the working directory
COPY .env ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port the app will run on
EXPOSE ${BEAM_SERVER_PORT}

# Build the application
RUN npm run build

# Start the application
CMD ["npm", "run", "start"]