import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Define styles
const styles = StyleSheet.create({
    page: {
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica',
        padding: 30,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#6366f1', // Indigo-500
        paddingBottom: 10,
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6366f1',
        textTransform: 'uppercase',
    },
    subHeader: {
        fontSize: 10,
        color: '#64748b',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 10,
        color: '#1e293b',
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    col: {
        flexDirection: 'column',
    },
    label: {
        fontSize: 10,
        color: '#64748b',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    value: {
        fontSize: 14,
        color: '#0f172a',
        fontWeight: 'bold',
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        marginVertical: 15,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 10,
        color: '#94a3b8',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 10,
    },
    qrPlaceholder: {
        width: 80,
        height: 80,
        backgroundColor: '#f1f5f9',
        alignSelf: 'center',
        marginTop: 20,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

interface TicketProps {
    passengerName?: string;
    source: string;
    destination: string;
    date: string;
    time: string;
    busNumber: string;
    price: number;
    ticketId: string;
}

// Create Document Component
export const TicketDocument = ({ ticket }: { ticket: TicketProps }) => (
    <Document>
        <Page size="A4" style={styles.page}>

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.logo}>FLEETPRO</Text>
                    <Text style={styles.subHeader}>Enterprise Bus Tracking</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.label}>E-TICKET REFERENCE</Text>
                    <Text style={{ fontSize: 12, color: '#6366f1' }}>#{ticket.ticketId.slice(0, 8).toUpperCase()}</Text>
                </View>
            </View>

            {/* Main Trip Info */}
            <View style={{ backgroundColor: '#f8fafc', padding: 20, borderRadius: 8 }}>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>FROM</Text>
                        <Text style={[styles.value, { fontSize: 20 }]}>{ticket.source}</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 20, color: '#94a3b8' }}>➔</Text>
                    </View>
                    <View style={[styles.col, { alignItems: 'flex-end' }]}>
                        <Text style={styles.label}>TO</Text>
                        <Text style={[styles.value, { fontSize: 20 }]}>{ticket.destination}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.divider} />

            {/* Details Grid */}
            <View style={styles.row}>
                <View style={styles.col}>
                    <Text style={styles.label}>PASSENGER</Text>
                    <Text style={styles.value}>{ticket.passengerName || "Kaushal Pawar"}</Text>
                </View>
                <View style={styles.col}>
                    <Text style={styles.label}>DATE</Text>
                    <Text style={styles.value}>{ticket.date}</Text>
                </View>
                <View style={[styles.col, { alignItems: 'flex-end' }]}>
                    <Text style={styles.label}>TIME</Text>
                    <Text style={styles.value}>{ticket.time}</Text>
                </View>
            </View>

            <View style={[styles.row, { marginTop: 10 }]}>
                <View style={styles.col}>
                    <Text style={styles.label}>BUS NUMBER</Text>
                    <Text style={styles.value}>{ticket.busNumber}</Text>
                </View>
                <View style={styles.col}>
                    <Text style={styles.label}>SEAT</Text>
                    <Text style={styles.value}>Any (Open)</Text>
                </View>
                <View style={[styles.col, { alignItems: 'flex-end' }]}>
                    <Text style={styles.label}>TOTAL PRICE</Text>
                    <Text style={[styles.value, { color: '#6366f1' }]}>₹ {ticket.price.toFixed(2)}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            {/* Instructions */}
            <View>
                <Text style={[styles.title, { fontSize: 14 }]}>Important Instructions</Text>
                <Text style={{ fontSize: 10, color: '#475569', lineHeight: 1.5, marginBottom: 5 }}>
                    1. Please report to the terminal at least 15 minutes before departure.
                </Text>
                <Text style={{ fontSize: 10, color: '#475569', lineHeight: 1.5, marginBottom: 5 }}>
                    2. Show this e-ticket along with a valid Government ID proof.
                </Text>
                <Text style={{ fontSize: 10, color: '#475569', lineHeight: 1.5, marginBottom: 5 }}>
                    3. Use the QR code below for automated turnstile entry.
                </Text>
            </View>

            {/* QR Placeholder */}
            <View style={styles.qrPlaceholder}>
                <Text style={{ fontSize: 8, color: '#cbd5e1' }}>SCAN ME</Text>
                {/* In a real app, an Image tag with generated QR data URI would go here */}
                <View style={{ width: 60, height: 60, borderWidth: 4, borderColor: '#000' }}></View>
            </View>

            {/* Footer */}
            <Text style={styles.footer}>
                Thank you for choosing FleetPro Enterprise. Have a safe journey.
                Generated on {new Date().toLocaleDateString()}
            </Text>

        </Page>
    </Document>
);
