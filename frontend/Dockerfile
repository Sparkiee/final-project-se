# Use the official Node.js image
FROM node:14

# Set the working directory
WORKDIR /app

# # Copy package.json 
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Expose the default React port (3000)
EXPOSE 3000

# Run the React development server
CMD ["npm", "start"]