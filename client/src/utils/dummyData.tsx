export const imageData = [
    require('../assets/category/1.png'),
    require('../assets/category/2.png'),
    require('../assets/category/3.png'),
    require('../assets/category/4.png'),
    require('../assets/category/5.png'),
    require('../assets/category/6.png'),
    require('../assets/category/7.png'),
    require('../assets/category/8.png'),
    require('../assets/category/9.png'),
    require('../assets/category/10.png'),
    require('../assets/category/11.png'),
    require('../assets/category/12.png'),
]

export const adData = [
    require('../assets/products/c1.jpg'),
    require('../assets/products/c2.jpg'),
    require('../assets/products/c3.jpeg'),
    require('../assets/products/c2.jpg'),
    require('../assets/products/c1.jpg'),
]

export const productsList =
    [
        {
            id: 1,
            name: 'Castrol Engine Oil 5W-30',
            image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400',
            price: 450,
            discountPrice: 500,
            quantity: '1 L',
        },
        {
            id: 2,
            name: 'Bosch Brake Pads Set',
            image: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=400',
            price: 1200,
            discountPrice: 1400,
            quantity: 'Set of 4',
        },
        {
            id: 3,
            name: 'Mann Air Filter',
            image: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=400',
            price: 350,
            discountPrice: 400,
            quantity: '1 piece',
        },
        {
            id: 4,
            name: 'Exide Car Battery 12V',
            image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400',
            price: 4500,
            discountPrice: 5000,
            quantity: '1 unit',
        },
        {
            id: 5,
            name: 'Michelin Tire 195/65 R15',
            image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
            price: 3200,
            discountPrice: 3500,
            quantity: '1 piece',
        },
        {
            id: 6,
            name: 'NGK Spark Plugs Set',
            image: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=400',
            price: 800,
            discountPrice: 900,
            quantity: 'Set of 4',
        },
        {
            id: 7,
            name: 'Mobil 1 Synthetic Oil',
            image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400',
            price: 650,
            discountPrice: 750,
            quantity: '1 L',
        },
        {
            id: 8,
            name: 'Wiper Blades Set',
            image: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=400',
            price: 400,
            discountPrice: 500,
            quantity: 'Set of 2',
        }
        , {
            id: 9,
            name: 'Coolant Fluid 1L',
            image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400',
            price: 250,
            discountPrice: 300,
            quantity: '1 L',
        }
        , {
            id: 10,
            name: 'LED Headlight Bulbs',
            image: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=400',
            price: 1500,
            discountPrice: 1800,
            quantity: 'Set of 2',
        }
    ]



export const categories = [
    {
        id: 1,
        name: "Engine Oil & Lubricants",
        image: require('../assets/category/1.png'),
        products: productsList
    },
    {
        id: 2,
        name: "Car Care & Maintenance",
        image: require('../assets/category/2.png')
    },
    {
        id: 3,
        name: "Tires & Wheels",
        image: require('../assets/category/3.png')
    },
    {
        id: 4,
        name: "Brakes & Suspension",
        image: require('../assets/category/4.png')
    },
    {
        id: 5,
        name: "Interior Accessories",
        image: require('../assets/category/5.png')
    },
    {
        id: 6,
        name: "Lighting & Electrical",
        image: require('../assets/category/6.png')
    },
    {
        id: 7,
        name: "Filters & Belts",
        image: require('../assets/category/7.png')
    },
    {
        id: 8,
        name: "Batteries & Chargers",
        image: require('../assets/category/8.png')
    },
    {
        id: 9,
        name: "Car Parts",
        image: require('../assets/category/9.png')
    },
    {
        id: 10,
        name: "Accessories",
        image: require('../assets/category/10.png')
    },
    {
        id: 11,
        name: "Tools & Equipment",
        image: require('../assets/category/11.png')
    },
    {
        id: 12,
        name: "Spare Parts",
        image: require('../assets/category/12.png')
    },
]


export const wavyData = "M 0 2000 0 500 Q 62.5 280 125 500 t 125 0 125 0 125 0 125 0 125 0 125 0 125 0 125 0 125 0 125 0   125 0 125 0 125 0  125 0 125 0 125 0  125 0 125 0 125 0  125 0 125 0 125 0  125 0 125 0 125 0  125 0 125 0 125 0  125 0 125 0 125 0  125 0 125 0 125 0  125 0 125 0 125 0  125 0 125 0 125 0 v1000 z"





export const orders = [
    {
        orderId: 'ORDER21312',
        items: [
            { id: 'a', item: { name: 'Engine Oil' }, count: 2 },
            { id: 'b', item: { name: 'Air Filter' }, count: 1 },
        ],
        totalPrice: 1250.00,
        createdAt: '2024-08-10T10:00:00Z',
        status: 'delivered'
    },
    {
        orderId: 'ORDER21212',
        items: [
            { id: 'c', item: 'Brake Pads', count: 1 },
            { id: 'd', item: 'Wiper Blades', count: 2 },
        ],
        totalPrice: 1600.00,
        createdAt: '2024-08-11T11:30:00Z',
        status: 'available'
    },
];