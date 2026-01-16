FROM node:20

# 1. Install FFmpeg, Python, and Libsodium (Required for Voice/Audio)
RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip libsodium-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory inside container
WORKDIR /app

# Copy package files first (helps caching)
COPY package*.json ./

# Install node modules
RUN npm install

# Copy the rest of the project
COPY . .

# Start the bot
CMD ["node", "index.js"]