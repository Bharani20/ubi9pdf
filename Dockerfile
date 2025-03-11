# # Use a lightweight Node.js image
# FROM node:20-slim

# # Set environment variables for Puppeteer
# ENV PUPPETEER_EXECUTABLE_PATH="/app/google-chrome" \
#     HOME="/app" \
#     NODE_ENV="development" \
#     PUPPETEER_SKIP_DOWNLOAD="true" \
#     PUPPETEER_CACHE_DIR="/tmp"

# # Set working directory
# WORKDIR /app

# # Install required dependencies
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     wget \
#     curl \
#     gnupg \
#     libgbm1 \
#     libatk1.0-0 \
#     libasound2 \
#     libpangocairo-1.0-0 \
#     libx11-xcb1 \
#     libxcomposite1 \
#     libxdamage1 \
#     libxrandr2 \
#     libgtk-3-0 \
#     libnss3 \
#     libxss1 \
#     libxshmfence1 \
#     ca-certificates \
#     fonts-liberation \
#     xdg-utils \
#     unzip

# # Copy Google Chrome .deb file
# COPY google-chrome-stable_current_amd64.deb /tmp/google-chrome.deb

# # Manually extract Chrome without running its post-install scripts
# RUN dpkg-deb -x /tmp/google-chrome.deb /app/chrome-files && \
#     mv /app/chrome-files/opt/google/chrome /app/chrome && \
#     ln -s /app/chrome/google-chrome /app/google-chrome

# # Verify Chrome installation
# RUN ls -l /app/chrome/ && /app/google-chrome --version

# # Copy package.json and package-lock.json
# COPY package.json package-lock.json ./

# # Install Node.js dependencies (without dev dependencies)
# RUN npm install --omit=dev --no-optional && npm cache clean --force

# # Copy project files
# COPY . .

# # Expose necessary ports
# EXPOSE 8080

# # Start your application
# CMD ["node", "server.js"]

# # Use a lightweight Node.js image  
# FROM node:20-slim  

# # Set working directory  
# WORKDIR /app  

# # Install required system dependencies  
# RUN apt-get update && apt-get install -y --no-install-recommends \  
#     wget \  
#     curl \  
#     gnupg \  
#     libgbm1 \  
#     libatk1.0-0 \  
#     libasound2 \  
#     libpangocairo-1.0-0 \  
#     libx11-xcb1 \  
#     libxcomposite1 \  
#     libxdamage1 \  
#     libxrandr2 \  
#     libgtk-3-0 \  
#     libnss3 \  
#     libxss1 \  
#     libxshmfence1 \  
#     ca-certificates \  
#     fonts-liberation \  
#     xdg-utils \  
#     unzip  

# # Create necessary directories in /app  
# RUN mkdir -p /app/libs /app/local /app/etc  

# # Copy system libraries separately to avoid conflicts  
# RUN cp -r /lib/* /app/libs/ && \  
#     cp -r /usr/lib/* /app/libs/ && \  
#     cp -r /usr/local/* /app/local/ && \  
#     cp -r /etc/* /app/etc/  

# # Copy Google Chrome .deb file  
# COPY google-chrome-stable_current_amd64.deb /tmp/google-chrome.deb  

# # Manually extract Chrome without running its post-install scripts  
# RUN dpkg-deb -x /tmp/google-chrome.deb /app/chrome-files && \  
#     mv /app/chrome-files/opt/google/chrome /app/chrome && \  
#     ln -s /app/chrome/google-chrome /app/google-chrome  

# # Verify Chrome installation  
# RUN ls -l /app/chrome/ && /app/google-chrome --version  

# # Copy package.json and package-lock.json  
# COPY package.json ./  

# # Install Node.js dependencies inside /app  
# RUN npm install --omit=dev --no-optional --prefix /app && npm cache clean --force  

# # Copy project files  
# COPY . .  

# # Ensure all files remain inside /app  
# RUN find /app -type f  

# # Expose necessary ports  
# EXPOSE 8080

# # Start the application using npm start  
# CMD ["npm", "start"]  


#ubi9 images
# # Use UBI9 Node.js 20 image
# FROM registry.access.redhat.com/ubi9/nodejs-20:latest

# # Set working directory
# WORKDIR /app

# # Install required system dependencies
# USER root
# RUN dnf install -y \
#     wget \
#     curl \
#     libgbm \
#     atk \
#     alsa-lib \
#     cairo \
#     pango \
#     libX11-xcb \
#     libXcomposite \
#     libXdamage \
#     libXrandr \
#     gtk3 \
#     nss \
#     libXScrnSaver \
#     libxshmfence \
#     ca-certificates \
#     unzip \
#     --allowerasing && \
#     dnf clean all

#     RUN dnf install -y \
#     fontconfig \
#     liberation-fonts-common \
#     liberation-mono-fonts \
#     liberation-narrow-fonts \
#     liberation-sans-fonts \
#     liberation-serif-fonts \
#     xdg-utils && \
#     dnf clean all


# # Ensure Chrome .rpm file exists
# COPY google-chrome-stable_current_x86_64.rpm /tmp/google-chrome.rpm
# RUN test -f /tmp/google-chrome.rpm || wget -O /tmp/google-chrome.rpm https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm

# # Install Google Chrome manually
# RUN dnf install -y /tmp/google-chrome.rpm --setopt=install_weak_deps=False --setopt=tsflags=nodocs && \
#     ln -s /usr/bin/google-chrome-stable /app/google-chrome && \
#     google-chrome --version

# # Copy package.json and package-lock.json
# COPY package.json ./

# # Install Node.js dependencies (as non-root user)
# USER 1001
# RUN npm install --omit=dev --no-optional --prefix /app && npm cache clean --force

# # Copy application source code
# COPY . .

# # Expose the necessary port
# EXPOSE 8080

# # Start the application
# CMD ["npm", "start"]

# # Use lightweight Node.js base image
# FROM node:20-slim

# # Set working directory
# WORKDIR /app

# # Install required system dependencies for Chromium
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     libnss3 \
#     libx11-xcb1 \
#     libxcb-dri3-0 \
#     libdrm2 \
#     libxcomposite1 \
#     libxdamage1 \
#     libxfixes3 \
#     libxrandr2 \
#     libgbm1 \
#     libasound2 \
#     libpango-1.0-0 \
#     libpangocairo-1.0-0 \
#     libatk1.0-0 \
#     libcups2 \
#     libatk-bridge2.0-0 \
#     libxkbcommon0 \
#     libxshmfence1 \
#     && rm -rf /var/lib/apt/lists/*  # Clean up APT cache

# # Set up writable permissions for /app and /tmp
# RUN chmod -R 777 /app

# # Copy Chromium Headless Shell from local machine
# COPY playwright-browsers /app/playwright-browsers

# # Copy your Playwright script and package.json
# COPY . /app/

# # Install only required Node.js dependencies
# RUN npm install --omit=dev

# # Set environment variables for Playwright
# ENV PLAYWRIGHT_EXECUTABLE_PATH="/app/playwright-browsers/chromium_headless_shell-1155/chrome-linux/headless_shell"
# ENV PLAYWRIGHT_DISABLE_ERROR_REPORTING=1

# # Expose the necessary port
# EXPOSE 8080

# # Start the application
# CMD ["npm", "start"]
# # Use Red Hat UBI 8 with Node.js 20
# FROM registry.access.redhat.com/ubi8/nodejs-20

# # Set the working directory
# WORKDIR /app

# # Switch to root to install dependencies
# USER root

# # Install required system dependencies for Playwright/Chromium
# RUN dnf install -y \
#     nss \
#     pango \
#     cairo \
#     atk \
#     cups-libs \
#     libXcomposite \
#     libXdamage \
#     libXfixes \
#     libXrandr \
#     && dnf clean all

# # Ensure /app and /tmp have appropriate permissions
# RUN chmod -R 777 /app /tmp

# # Switch back to a non-root user
# USER 1001

# # Copy application files
# COPY . /app/

# # Install only production dependencies
# RUN npm install --omit=dev

# # Set environment variables for Playwright
# ENV PLAYWRIGHT_EXECUTABLE_PATH="/app/playwright-browsers/chromium_headless_shell-1155/chrome-linux/headless_shell"
# ENV LD_LIBRARY_PATH="/app/lib/"
# ENV PLAYWRIGHT_DISABLE_ERROR_REPORTING=1

# # Expose the necessary port
# EXPOSE 8080

# # Start the application
# CMD ["npm", "start"]

# # Use Red Hat UBI 8 with Node.js 20
# FROM registry.access.redhat.com/ubi8/nodejs-20

# # Set the working directory
# WORKDIR /app

# # Switch to root to install dependencies
# USER root

# # Install cpio (required for extracting RPM contents)
# RUN dnf install -y cpio

# # Create necessary directories
# RUN mkdir -p /app/lib /tmp/libs

# # Install required system dependencies for Playwright/Chromium and store them in /tmp/libs
# RUN dnf install -y --downloadonly --downloaddir=/tmp/libs \
#     nss \
#     pango \
#     cairo \
#     atk \
#     cups-libs \
#     libXcomposite \
#     libXdamage \
#     libXfixes \
#     libXrandr \
#     && dnf clean all

# # Extract and copy dependencies to /app/lib
# RUN for pkg in /tmp/libs/*.rpm; do \
#         rpm2cpio "$pkg" | cpio -idmv && \
#         find . -type f -name "*.so*" -exec cp -v {} /app/lib/ \; ; \
#     done

# # Ensure /app and /tmp have appropriate permissions
# RUN chmod -R 777 /app /tmp /app/lib

# # Set LD_LIBRARY_PATH for all processes
# ENV LD_LIBRARY_PATH="/app/lib"

# # Switch back to a non-root user
# USER 1001

# # Copy application files
# COPY . /app/

# # Install only production dependencies
# RUN npm install --omit=dev

# # Set environment variables for Playwright
# ENV PLAYWRIGHT_EXECUTABLE_PATH="/app/playwright-browsers/chromium_headless_shell-1155/chrome-linux/headless_shell"
# ENV PLAYWRIGHT_DISABLE_ERROR_REPORTING=1

# # Expose the necessary port
# EXPOSE 8080

# # Start the application
# CMD ["npm", "start"]

# Use Red Hat UBI 8 with Node.js 20
# FROM registry.access.redhat.com/ubi8/nodejs-20

# # Set the working directory
# WORKDIR /app

# # Switch to root to install dependencies
# USER root

# # Install required system dependencies for Playwright/Chromium
# RUN dnf install -y \
#     nss \
#     libX11-xcb \
#     libxcb \
#     mesa-libGLU \
#     mesa-libEGL \
#     mesa-libGL \
#     alsa-lib \
#     pango \
#     cairo \
#     atk \
#     cups-libs \
#     at-spi2-atk \
#     libXcomposite \
#     libXdamage \
#     libXfixes \
#     libXrandr \
#     libxkbcommon \
#     libxshmfence \
#     && dnf clean all

# # Ensure /app and /tmp have appropriate permissions
# RUN chmod -R 777 /app /tmp

# # Switch back to a non-root user
# USER 1001

# # Copy application files
# COPY . /app/

# # Install only production dependencies
# RUN npm install --omit=dev

# # Set environment variables for Playwright
# ENV PLAYWRIGHT_EXECUTABLE_PATH="/app/playwright-browsers/chromium_headless_shell-1155/chrome-linux/headless_shell"
# ENV LD_LIBRARY_PATH="/app/lib/"
# ENV PLAYWRIGHT_DISABLE_ERROR_REPORTING=1

# # Expose the necessary port
# EXPOSE 8080

# # Start the application
# CMD ["npm", "start"]

# # Use Red Hat UBI 8 with Node.js 20
# FROM registry.access.redhat.com/ubi8/nodejs-20

# # Set the working directory
# WORKDIR /app

# # Switch to root to install dependencies
# USER root

# # Install cpio (required for extracting RPM contents)
# RUN dnf install -y cpio

# # Create necessary directories
# RUN mkdir -p /app/lib /app/fonts /tmp/libs

# # Install required system dependencies for Playwright/Chromium and store them in /tmp/libs
# RUN dnf install -y --downloadonly --downloaddir=/tmp/libs \
#     nss \
#     pango \
#     cairo \
#     atk \
#     cups-libs \
#     libXcomposite \
#     libXdamage \
#     libXfixes \
#     libXrandr \
#     fontconfig \
#     freetype \
#     dejavu-sans-fonts \
#     dejavu-serif-fonts \
#     && dnf clean all

# # Extract and copy dependencies to /app/lib
# RUN for pkg in /tmp/libs/*.rpm; do \
#         rpm2cpio "$pkg" | cpio -idmv && \
#         find . -type f -name "*.so*" -exec cp -v {} /app/lib/ \; ; \
#     done
# #install dependencies
# RUN dnf install -y \
#     nss \
#     pango \
#     cairo \
#     atk \
#     cups-libs \
#     libXcomposite \
#     libXdamage \
#     libXfixes \
#     libXrandr \
#     fontconfig \
#     freetype \
#     dejavu-sans-fonts \
#     dejavu-serif-fonts \
#     && dnf clean all

# # Copy font configuration and fonts to /app/fonts
# RUN cp -r /etc/fonts /app/fonts && \
#     cp -r /usr/share/fonts /app/fonts

# # Ensure /app, /tmp, and /app/fonts have appropriate permissions
# RUN chmod -R 777 /app /tmp /app/lib /app/fonts

# # Set environment variables for Playwright
# ENV LD_LIBRARY_PATH="/app/lib"
# ENV FONTCONFIG_PATH="/app/etc/fonts"
# ENV PLAYWRIGHT_EXECUTABLE_PATH="/app/playwright-browsers/chromium_headless_shell-1155/chrome-linux/headless_shell"
# ENV PLAYWRIGHT_DISABLE_ERROR_REPORTING=1

# # Switch back to a non-root user
# USER 1001

# # Copy application files
# COPY . /app/

# # Install only production dependencies
# RUN npm install --omit=dev

# # Expose the necessary port
# EXPOSE 8080

# # Start the application
# CMD ["npm", "start"]

# Use Red Hat UBI 8 with Node.js 20
# FROM registry.access.redhat.com/ubi8/nodejs-20

# # Set the working directory
# WORKDIR /app

# # Switch back to a non-root user
# USER 1001

# # Copy application files
# COPY . /app/

# # Set environment variables for Playwright
# ENV LD_LIBRARY_PATH="/app/lib"
# ENV FONTCONFIG_PATH="/app/etc/fonts"
# ENV PLAYWRIGHT_EXECUTABLE_PATH="/app/playwright-browsers/chromium_headless_shell-1155/chrome-linux/headless_shell"
# ENV PLAYWRIGHT_DISABLE_ERROR_REPORTING=1

# # Install only production dependencies
# RUN npm install --omit=dev

# # Expose the necessary port
# EXPOSE 8080

# # Start the application
# CMD ["npm", "start"]
# Use Red Hat UBI 8 with Node.js 20
# FROM registry.access.redhat.com/ubi8/nodejs-20

# # Set the working directory
# WORKDIR /app

# # Copy pre-downloaded RPMs into the container
# COPY rpms/ /app/rpms/

# # Create an extraction directory
# RUN mkdir -p /app/extracted

# # Extract `cpio` RPM without using `cpio`
# RUN rpm2cpio /app/rpms/cpio-*.rpm | bsdtar -xvf - -C /app/extracted/

# # Ensure extracted `cpio` binary is used
# ENV PATH="/app/extracted/usr/bin:$PATH"

# # Extract remaining RPMs using the extracted `cpio`
# RUN /bin/bash -c 'for rpm in /app/rpms/*.rpm; do \
#         rpm2cpio "$rpm" | /app/extracted/usr/bin/cpio -idmv -D /app/extracted/; \
#     done'

# # Set environment variables for libraries
# ENV LD_LIBRARY_PATH="/app/extracted/usr/lib64:/app/extracted/usr/lib:$LD_LIBRARY_PATH"

# # Copy application files
# COPY . /app/

# # Switch to non-root user
# USER 1001

# # Install only production dependencies
# RUN npm install --omit=dev

# # Expose the necessary port
# EXPOSE 8080

# # Start the application
# CMD ["npm", "start"]

# Step 1: Use UBI9 Node.js 20 as the base image
# # Use UBI9 Node.js 20 as the base image
# FROM registry.access.redhat.com/ubi9/nodejs-20 AS builder

# # Switch to root for installations
# USER root

# # Set working directory
# WORKDIR /opt/app-root/src/

# # Install system dependencies required for Playwright and headless Chromium
# RUN dnf install -y \
#     glibc-langpack-en \
#     libX11 \
#     libXcomposite \
#     libXcursor \
#     libXdamage \
#     libXext \
#     libXi \
#     libXtst \
#     pango \
#     atk \
#     at-spi2-atk \
#     cups-libs \
#     dbus-glib \
#     fontconfig \
#     dejavu-sans-fonts \
#     alsa-lib \
#     nss \
#     libdrm \
#     mesa-libgbm \
#     gtk3 \
#     && dnf clean all

# # Create required directories inside /opt/app-root/src/extracted/
# RUN mkdir -p /opt/app-root/src/extracted/libs \
#     /opt/app-root/src/extracted/fonts \
#     /opt/app-root/src/extracted/chromium

# # ✅ Use `cp -r` instead of COPY for system files
# RUN cp -r /usr/lib64 /opt/app-root/src/extracted/libs/ && \
#     cp -r /usr/share/fonts /opt/app-root/src/extracted/fonts/

# # Copy pre-downloaded Playwright Chromium from your local project directory to OpenShift
# COPY --chown=1001:0 playwright-browsers/chromium_headless_shell-1155 /opt/app-root/src/extracted/chromium/

# # Copy the Node.js project from local machine to OpenShift /opt/app-root/src/
# COPY --chown=1001:0 . /opt/app-root/src/

# # Set environment variables
# ENV LD_LIBRARY_PATH="/opt/app-root/src/extracted/libs:/usr/lib64:$LD_LIBRARY_PATH" \
#     FONTCONFIG_PATH="/opt/app-root/src/extracted/fonts" \
#     PLAYWRIGHT_EXECUTABLE_PATH="/opt/app-root/src/extracted/chromium/chrome-linux/headless_shell"

# # Switch to non-root user (1001) for running the application
# USER 1001

# # Ensure the working directory is /opt/app-root/src/
# WORKDIR /opt/app-root/src/

# # Install Node.js dependencies
# RUN npm install --omit=dev

# # Expose the necessary port
# EXPOSE 8080

# # Start the application
# CMD ["npm", "start"]

# # Use UBI9 Node.js 20 as the base image
# FROM registry.access.redhat.com/ubi9/nodejs-20 AS builder

# # Switch to root for installations
# USER root

# # Set working directory
# WORKDIR /opt/app-root/src/

# # Install system dependencies required for Playwright and headless Chromium
# RUN dnf install -y \
#     glibc-langpack-en \
#     libX11 \
#     libXcomposite \
#     libXcursor \
#     libXdamage \
#     libXext \
#     libXi \
#     libXtst \
#     pango \
#     atk \
#     at-spi2-atk \
#     cups-libs \
#     dbus-glib \
#     fontconfig \
#     dejavu-sans-fonts \
#     alsa-lib \
#     nss \
#     libdrm \
#     mesa-libgbm \
#     gtk3 \
#     && dnf clean all

# # Create required directories inside /opt/app-root/src/extracted/
# RUN mkdir -p /opt/app-root/src/extracted/libs \
#     /opt/app-root/src/extracted/fonts \
#     /opt/app-root/src/extracted/chromium

# # ✅ Copy system libraries & fonts to extracted location
# RUN cp -r /usr/lib64 /opt/app-root/src/extracted/libs/ && \
#     cp -r /usr/share/fonts /opt/app-root/src/extracted/fonts/

# # ✅ Copy pre-downloaded Playwright Chromium from your local project directory
# COPY --chown=1001:0 playwright-browsers/chromium_headless_shell-1155 /opt/app-root/src/extracted/chromium/

# # ✅ Copy Node.js project into `/opt/app-root/src/`
# COPY --chown=1001:0 . /opt/app-root/src/

# # ✅ Ensure full access to all files inside /opt/app-root/src/
# RUN chmod -R 777 /opt/app-root/src/

# # ✅ Copy the system font configuration file instead of using `echo`
# RUN cp /etc/fonts/fonts.conf /opt/app-root/src/extracted/fonts/fonts.conf

# # Set environment variables
# ENV LD_LIBRARY_PATH="/opt/app-root/src/extracted/libs:/usr/lib64:$LD_LIBRARY_PATH" \
#     FONTCONFIG_PATH="/opt/app-root/src/extracted/fonts/fonts.conf" \
#     FONTCONFIG_FILE="/opt/app-root/src/extracted/fonts/fonts.conf" \
#     FC_CONFIG_DIR="/opt/app-root/src/extracted/fonts" \
#     PLAYWRIGHT_EXECUTABLE_PATH="/opt/app-root/src/extracted/chromium/chrome-linux/headless_shell"

# # Switch to non-root user (1001) for running the application
# USER 1001

# # Ensure the working directory is /opt/app-root/src/
# WORKDIR /opt/app-root/src/

# # Install Node.js dependencies
# RUN npm install --omit=dev

# # Expose the necessary port
# EXPOSE 8080

# # Start the application
# CMD ["npm", "start"]

# # Use UBI9 Node.js 20 as the base image
# FROM registry.access.redhat.com/ubi9/nodejs-20 AS builder

# # Switch to root for installations
# USER root

# # Set working directory
# WORKDIR /opt/app-root/src/

# # Install system dependencies required for Playwright and headless Chromium
# RUN dnf install -y \
#     glibc-langpack-en \
#     libX11 \
#     libXcomposite \
#     libXcursor \
#     libXdamage \
#     libXext \
#     libXi \
#     libXtst \
#     pango \
#     atk \
#     at-spi2-atk \
#     cups-libs \
#     dbus-glib \
#     fontconfig \
#     dejavu-sans-fonts \
#     alsa-lib \
#     nss \
#     libdrm \
#     mesa-libgbm \
#     gtk3 \
#     && dnf clean all

# # Create required directories inside /opt/app-root/src/extracted/
# RUN mkdir -p /opt/app-root/src/extracted/libs \
#     /opt/app-root/src/extracted/fonts \
#     /opt/app-root/src/extracted/chromium

# # ✅ Copy system libraries & fonts to extracted location
# RUN cp -r /usr/lib64 /opt/app-root/src/extracted/libs/ && \
#     cp -r /usr/share/fonts /opt/app-root/src/extracted/fonts/

# # ✅ Copy system FontConfig file and update it
# RUN cp /etc/fonts/fonts.conf /opt/app-root/src/extracted/fonts/fonts.conf && \
#     chmod 666 /opt/app-root/src/extracted/fonts/fonts.conf && \
#     sed -i 's|/usr/share/fonts|/opt/app-root/src/extracted/fonts|g' /opt/app-root/src/extracted/fonts/fonts.conf

# # ✅ Copy pre-downloaded Playwright Chromium from your local project directory
# COPY --chown=1001:0 playwright-browsers/chromium_headless_shell-1155 /opt/app-root/src/extracted/chromium/

# # ✅ Copy Node.js project into `/opt/app-root/src/`
# COPY --chown=1001:0 . /opt/app-root/src/

# # ✅ Ensure full access to all files inside /opt/app-root/src/
# RUN chmod -R 777 /opt/app-root/src/

# # Set environment variables
# ENV LD_LIBRARY_PATH="/opt/app-root/src/extracted/libs:/usr/lib64:$LD_LIBRARY_PATH" \
#     FONTCONFIG_PATH="/opt/app-root/src/extracted/fonts/fonts.conf" \
#     FONTCONFIG_FILE="/opt/app-root/src/extracted/fonts/fonts.conf" \
#     FC_CONFIG_DIR="/opt/app-root/src/extracted/fonts" \
#     PLAYWRIGHT_EXECUTABLE_PATH="/opt/app-root/src/extracted/chromium/chrome-linux/headless_shell"

# # Switch to non-root user (1001) for running the application
# USER 1001

# # Ensure the working directory is /opt/app-root/src/
# WORKDIR /opt/app-root/src/

# # Install Node.js dependencies
# RUN npm install --omit=dev

# # Start the application
# CMD ["npm", "start"]


# Use UBI9 Node.js 20 as the base image
FROM registry.access.redhat.com/ubi9/nodejs-22

# Copy application files and set ownership
COPY --chown=1001:0 . /opt/app-root/src/

# Set environment variables
ENV LD_LIBRARY_PATH="/opt/app-root/src/extracted/libs:/usr/lib64:$LD_LIBRARY_PATH" \
    FONTCONFIG_PATH="/opt/app-root/src/extracted/fonts/fonts.conf" \
    FONTCONFIG_FILE="/opt/app-root/src/extracted/fonts/fonts.conf" \
    FC_CONFIG_DIR="/opt/app-root/src/extracted/fonts" \
    PLAYWRIGHT_EXECUTABLE_PATH="/opt/app-root/src/extracted/chromium/chrome-linux/headless_shell"

# Ensure non-root user has necessary permissions
USER 1001

# Set the working directory
WORKDIR /opt/app-root/src/

# Install only production dependencies
RUN npm install --omit=dev

# Expose the necessary port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]





