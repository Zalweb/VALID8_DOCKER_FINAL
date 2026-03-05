# Use official Node.js image
FROM node:20

# Set working directory inside the container
WORKDIR /app

# Copy only dependency files first to leverage Docker caching
COPY package.json package-lock.json ./

# Install dependencies using npm
RUN npm install

# Copy the rest of your app code
COPY . .

# Expose the port used by Vite dev server
EXPOSE 5173

# Start Vite dev server
CMD ["npm", "run", "dev"]
