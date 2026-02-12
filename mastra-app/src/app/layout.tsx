
import './globals.css';

export const metadata = {
    title: 'African-CX | Solimi Assistant',
    description: 'Support Client Intelligent pour Mobile Money',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr">
            <body>{children}</body>
        </html>
    );
}
