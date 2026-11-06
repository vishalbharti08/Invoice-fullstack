# Vendor & Finance Invoice Portal (frontend)

The web frontend for an invoice portal that replaces emailed vendor invoices. Vendors upload invoices and purchase orders, the finance team reviews them, and admins manage vendors. I built it in 2024.

This repository contains the **React frontend only**. It calls a separate REST API (`config.js` → `BASE_URL`), which isn't included here.

## Features

- Sign-up and login, with role-based protected routes for **vendor**, **finance** and **admin** dashboards
- Vendor dashboard: upload invoice and PO PDFs to Amazon S3, track submission status, and edit the vendor profile
- Finance dashboard: review submissions, preview PDFs, export to Excel, and approve or reject with a required remark
- Admin dashboard: add vendors, bulk-import vendors from an Excel sheet, and view audit logs
- Toast notifications for failed uploads and invalid input

## Stack

React 19 · Vite · React Router · Tailwind CSS · AWS SDK (S3) · pdf.js · SheetJS (xlsx) · Axios · Framer Motion

## Run locally

```bash
git clone https://github.com/vishalbharti08/Invoice-fullstack.git
cd Invoice-fullstack
npm install
npm run dev
```

Point `BASE_URL` in `config.js` at the API. The S3 upload reads `VITE_AWS_REGION`, `VITE_AWS_ACCESS_KEY_ID` and `VITE_AWS_SECRET_ACCESS_KEY` from a local `.env` file, which is not committed.

## Screenshots

![Portal screenshot 1](https://github.com/user-attachments/assets/09cd780c-2ad2-4648-a55a-c6b0ee93f407)
![Portal screenshot 2](https://github.com/user-attachments/assets/5b5729f6-9c97-49e7-bed9-d96756e2929f)
![Portal screenshot 3](https://github.com/user-attachments/assets/8c488ad8-8123-4808-9c9e-18ec6b3665af)
![Portal screenshot 4](https://github.com/user-attachments/assets/3cc3347a-a7de-4687-b6c7-228a266dd8d2)
![Portal screenshot 5](https://github.com/user-attachments/assets/2cd73ee5-260c-4570-9db9-204bd35dff06)
![Portal screenshot 6](https://github.com/user-attachments/assets/178f20c2-ba8e-4106-8484-98ddd99e0579)
![Portal screenshot 7](https://github.com/user-attachments/assets/6509c1d0-25c2-4a6a-be62-4fc35b9d2f21)
![Portal screenshot 8](https://github.com/user-attachments/assets/ce654506-0534-427c-9208-2da6446aeccd)
![Portal screenshot 9](https://github.com/user-attachments/assets/89dde104-60c2-47ec-aaf9-e50c2c3032b4)
