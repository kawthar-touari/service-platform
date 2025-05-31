import Service from '../models/Service.js';
import mongoose from 'mongoose';

export const addService = async (req, res) => {
  try {
    const {
      category,
      title,
      description,
      duration,
      experienceYears,
      previousWorkplaces,
      educationLevel,
      skillLevel,
      startingPrice,
      location, // { type: 'Point', coordinates: [longitude, latitude] }
      isActive,
      bio,
      services
    } = req.body;

    // Create a new service using the full schema
    const newService = new Service({
      User: req.user.id, // required
      category,
      title,
      description,
      duration,
      experienceYears,
      previousWorkplaces,
      educationLevel,
      skillLevel,
      startingPrice,
      location: {
        type: 'Point',
        coordinates: location?.coordinates || [0, 0],
      },
      createdBy: req.user.id,
      isActive: isActive ?? true,
      bio: bio || '',
      services: services || [],
      createdByName: req.user.fullName || '',
      createdByEmail: req.user.email || '',
      createdByPhone: req.user.phone || '',
      // createdAt, ratingsAverage, ratingsQuantity, and status have default values
    });

    const savedService = await newService.save();
    res.status(201).json(savedService);
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).json({ message: 'Failed to add service', error: error.message });
  }
};


// تعديل خدمة
export const updateService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    // تحقق من اسم الحقل الصحيح في موديل الخدمة
    // غالباً يكون createdBy وليس User
    if (service.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to modify this service' });
    }

    Object.assign(service, req.body);
    const updatedService = await service.save();
    res.status(200).json(updatedService);
  } catch (error) {
    res.status(500).json({ message: 'Failed to modify service', error: error.message });
  }
};

// حذف خدمة
export const deleteService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    if (service.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this service' });
    }

    await service.deleteOne();
    res.status(200).json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete service', error: error.message });
  }
};


// جلب كل خدمات العامل
export const getWorkerServices = async (req, res) => {
  try {
    const services = await Service.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch services', error: error.message });
  }
};

// تفعيل/تعطيل خدمة
export const toggleServiceStatus = async (req, res) => {
  try {
    const { id: serviceId } = req.params;

    // تأكد من وجود المستخدم
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'غير مصرح لك بتنفيذ هذا الطلب' });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'الخدمة غير موجودة' });
    }

    if (service.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'ليس لديك صلاحية لتعديل هذه الخدمة' });
    }

    service.isActive = !service.isActive;
    await service.save();

    res.status(200).json({
      message: `تم ${service.isActive ? 'تفعيل' : 'تعطيل'} الخدمة بنجاح`,
      service
    });
  } catch (error) {
    res.status(500).json({ message: 'فشل في تغيير حالة الخدمة', error: error.message });
  }
};

// جلب جميع الخدمات المتاحة (مثلاً للزبائن عند البحث)
export const getAllServices = async (_req, res) => {
  try {
    const services = await Service.find({ isActive: true })
      .select('-createdByEmail-createdByPhone')
      .sort({ createdAt: -1 });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch services', error: error.message });
  }
};

export const getServiceById = async (req, res) => {
  try {
    const userId = req.params.userId;
const services = await Service.find({ createdBy :userId });

    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user services', error: error.message });
  }
};

export const getUserFromService = async (req, res) => {
  try {
    const serviceId = req.params.id;

    // جلب الخدمة مع تعبئة بيانات المستخدم (populate) من الحقل المرجعي الصحيح
    const service = await Service.findById(serviceId).populate('createdBy');

    if (!service) {
      return res.status(404).json({ message: 'الخدمة غير موجودة' });
    }

    if (!service.createdBy) {
      return res.status(404).json({ message: 'صاحب الخدمة غير موجود' });
    }

    // إرجاع بيانات صاحب الخدمة فقط
    res.status(200).json(service.createdBy);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات المستخدم', error: error.message });
  }
};
