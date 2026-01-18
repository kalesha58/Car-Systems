// CRITICAL: Load environment variables FIRST
import '../config/env';

import { connectDatabase } from '../config/database';
import { VehicleBrand } from '../models/VehicleBrand';
import { VehicleModel } from '../models/VehicleModel';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

const carData = {
    'Maruti Suzuki': ['Swift', 'Baleno', 'Dzire', 'WagonR', 'Alto', 'Ertiga', 'Brezza', 'Celerio', 'Ignis', 'S-Presso'],
    'Hyundai': ['Creta', 'Venue', 'i20', 'Grand i10 Nios', 'Verna', 'Aura', 'Alcazar', 'Tucson', 'Exter', 'Santro'],
    'Tata': ['Nexon', 'Punch', 'Tiago', 'Altroz', 'Harrier', 'Safari', 'Tigor', 'Nexon EV', 'Tiago EV', 'Safari Storme'],
    'Mahindra': ['Thar', 'Scorpio-N', 'XUV700', 'Bolero', 'XUV300', 'Marazzo', 'Alturas G4', 'KUV100 NXT', 'Bolero Neo', 'Scorpio Classic'],
    'Honda': ['City', 'Amaze', 'Elevate', 'Jazz', 'WR-V', 'Civic', 'CR-V', 'BR-V', 'Mobilio', 'Accord'],
    'Toyota': ['Innova Crysta', 'Fortuner', 'Glanza', 'Urban Cruiser Hyryder', 'Camry', 'Vellfire', 'Hilux', 'Land Cruiser', 'Rumion', 'Innova Hycross'],
    'Kia': ['Seltos', 'Sonet', 'Carens', 'Carnival', 'EV6', 'Rio', 'Soul', 'Sportage', 'Niro', 'Stinger'],
    'Volkswagen': ['Virtus', 'Taigun', 'Tiguan', 'Polo', 'Vento', 'T-Roc', 'Passat', 'Jetta', 'Ameo', 'Beetle'],
    'Skoda': ['Slavia', 'Kushaq', 'Kodiaq', 'Octavia', 'Superb', 'Rapid', 'Karoq', 'Fabia', 'Yeti', 'Kamiq'],
    'MG': ['Hector', 'Astor', 'ZS EV', 'Comet EV', 'Gloster', 'Hector Plus', 'Marvel R', 'One', 'RC-6', 'RX5'],
};

const bikeData = {
    'Hero': ['Splendor Plus', 'HF Deluxe', 'Passion Pro', 'Glamour', 'Xtreme 160R', 'Pleasure Plus', 'Destini 125', 'Xpulse 200', 'Super Splendor', 'Maestro Edge 125'],
    'Honda': ['Activa 6G', 'Shine 125', 'SP 125', 'Unicorn', 'Dio', 'Hornet 2.0', 'Livo', 'CD 110 Dream', 'X-Blade', 'CB200X'],
    'TVS': ['Jupiter', 'Apache RTR 160', 'Apache RTR 160 4V', 'Ntorq 125', 'Radeon', 'Sport', 'Star City Plus', 'XL100', 'iQube', 'Ronin'],
    'Bajaj': ['Pulsar 150', 'Pulsar NS200', 'Platina 100', 'CT 110X', 'Avenger Cruise 220', 'Dominar 400', 'Chetak', 'Discover 125', 'Pulsar N160', 'Pulsar F250'],
    'Royal Enfield': ['Classic 350', 'Bullet 350', 'Meteor 350', 'Himalayan', 'Hunter 350', 'Interceptor 650', 'Continental GT 650', 'Scram 411', 'Super Meteor 650', 'Shotgun 650'],
    'Yamaha': ['MT-15 V2', 'R15 V4', 'FZ-S FI V4', 'Fascino 125', 'RayZR 125', 'Aerox 155', 'FZ-X', 'Fazer 25', 'Saluto', 'SZ-RR'],
    'Suzuki': ['Access 125', 'Burgman Street', 'Gixxer SF', 'Gixxer 250', 'Avenis', 'V-Strom SX', 'Hayabusa', 'Katana', 'Intruder', 'Gixxer SF 250'],
    'KTM': ['Duke 200', 'Duke 390', 'RC 200', 'RC 390', 'Adventure 390', 'Duke 250', 'RC 125', 'Duke 125', 'Adventure 250', 'Enduro R'],
    'Jawa': ['Classic', '42', 'Perak', '42 Bobber', '350', 'Standard', 'Scrambler', 'Racer', 'Adventure', 'Cruiser'],
    'Ola Electric': ['S1 Pro', 'S1 Air', 'S1 X', 'S1 X+', 'Roadster', 'Adventure', 'Cruiser', 'Diamondhead', 'S1', 'S1 Lite'],
};

const seedVehicleModels = async (): Promise<void> => {
    logger.info('Starting vehicle brand and model seeding...');

    try {
        await connectDatabase();
        logger.info('Database connected');

        // Seed Cars
        logger.info('Seeding Cars...');
        for (const [brandName, models] of Object.entries(carData)) {
            // Create or Update Brand
            let brand = await VehicleBrand.findOne({ name: brandName, type: 'Car' });
            if (!brand) {
                brand = await VehicleBrand.create({ name: brandName, type: 'Car', status: 'active' });
                logger.info(`Created Brand: ${brandName} (Car)`);
            } else {
                logger.info(`Brand already exists: ${brandName} (Car)`);
            }

            // Create or Update Models
            for (const modelName of models) {
                const existingModel = await VehicleModel.findOne({ brandId: brand.id, name: modelName });
                if (!existingModel) {
                    await VehicleModel.create({ brandId: brand.id, name: modelName, status: 'active' });
                    //   logger.info(`Created Model: ${modelName} for ${brandName}`);
                }
            }
            logger.info(`Seeded models for ${brandName}`);
        }

        // Seed Bikes
        logger.info('Seeding Bikes...');
        for (const [brandName, models] of Object.entries(bikeData)) {
            // Create or Update Brand
            let brand = await VehicleBrand.findOne({ name: brandName, type: 'Bike' });
            if (!brand) {
                brand = await VehicleBrand.create({ name: brandName, type: 'Bike', status: 'active' });
                logger.info(`Created Brand: ${brandName} (Bike)`);
            } else {
                logger.info(`Brand already exists: ${brandName} (Bike)`);
            }

            // Create or Update Models
            for (const modelName of models) {
                const existingModel = await VehicleModel.findOne({ brandId: brand.id, name: modelName });
                if (!existingModel) {
                    await VehicleModel.create({ brandId: brand.id, name: modelName, status: 'active' });
                    //   logger.info(`Created Model: ${modelName} for ${brandName}`);
                }
            }
            logger.info(`Seeded models for ${brandName}`);
        }

        logger.info('Vehicle seeding completed successfully!');
    } catch (error) {
        logger.error('Error seeding vehicle models:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        logger.info('Database connection closed');
        process.exit(0);
    }
};

seedVehicleModels();
