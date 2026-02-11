const saveTicketToSheet = async (ticketData) => {
    const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz50JXDNchqwYEhK3igrMSNJBewqbh3MdMMNCBoBrinEmhJwd8loAca1pZhxArmfE7E/exec';

    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: "POST",
            redirect: "follow",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify(ticketData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Successfully saved to Google Sheet:', data);
        return data;
    } catch (error) {
        console.error('Error saving ticket to Google Sheet:', error);
        throw error;
    }
};

module.exports = {
    saveTicketToSheet,
};
