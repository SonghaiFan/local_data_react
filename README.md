# Local Drop - Next.js File Transfer App

A simple web application to transfer files (images, videos) from a mobile device to a desktop on the same Wi-Fi network.

## Features

- **Real-time File Transfer**: Files appear instantly on the desktop using Socket.IO.
- **QR Code Pairing**: Scan a QR code on the desktop to open the upload page on mobile.
- **Mobile Uploads**: Use your mobile camera or gallery to upload files.
- **Local Network Only**: Files stay on your local machine. No external cloud required.

## Prerequisites

- Node.js (v18 or later)
- Both devices must be on the **same Wi-Fi network**.

## Instructions

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Start the server**:
    ```bash
    npm run dev
    ```

3.  **Open the Desktop View**:
    - Open your browser and navigate to `http://localhost:3000`.
    - You will see a QR code.

4.  **Connect Mobile**:
    - Ensure your mobile device is connected to the same Wi-Fi network.
    - Scan the QR code with your mobile camera.
    - Or open the URL displayed below the QR code (e.g., `http://192.168.1.5:3000/upload`) on your mobile browser.

5.  **Transfer Files**:
    - Select "Tap to Capture" on your mobile.
    - Take a photo/video or choose from the gallery.
    - The file will automatically upload and appear on your desktop screen!

## Project Structure

- `server.ts`: Custom Node.js server handling HTTP and Socket.IO.
- `app/page.tsx`: Desktop view (Gallery).
- `app/upload/page.tsx`: Mobile view (Upload form).
- `app/api/upload/route.ts`: API route handling file uploads.
- `public/uploads`: Directory where uploaded files are stored.

## Troubleshooting

- **QR Code not working**: Ensure your firewall allows incoming connections on port 3000.
- **Mobile can't connect**: Verify the IP address is correct and both devices are on the same subnet.
