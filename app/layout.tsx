import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"ממחר דיאטה | מתחילות יחד",description:"פותחות קבוצה, בוחרות יעדים ומתחילות יחד.",icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="he" dir="rtl"><body>{children}</body></html>}
