export const getAllProducts = async () => {
    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`http://168.231.102.248:8080/demo-0.0.1-SNAPSHOT/products`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};