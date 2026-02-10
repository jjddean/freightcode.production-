// Simulate DocuSign status updates
export const simulateDocuSignUpdate = async (documentId: string, currentStatus: string) => {
    const statuses = ['sent', 'delivered', 'signed', 'completed'];
    const currentIndex = statuses.indexOf(currentStatus);


    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

    if (currentIndex < statuses.length - 1) {
        return statuses[currentIndex + 1];
    }
    return 'completed';
};
