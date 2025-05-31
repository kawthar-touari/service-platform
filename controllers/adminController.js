
import User from '../models/User.js';
import Service from '../models/Service.js';


export const deleteUserByAdmin = async (req, res) => {
  try {
    // تحقق من صلاحيات الأدمن
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: 'غير مصرح لك بهذه العملية' });
    }

    const userId = req.params.id;

    // لا يمكن حذف الأدمن نفسه
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'لا يمكنك حذف نفسك كأدمن' });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.status(200).json({ message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'فشل في حذف المستخدم', error: error.message });
  }
};


export const deleteServiceByAdmin = async (req, res) => {
  try {
    // تحقق من صلاحيات الأدمن
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: 'غير مصرح لك بحذف الخدمات' });
    }

    const serviceId = req.params.id;

    const service = await Service.findByIdAndDelete(serviceId);

    if (!service) {
      return res.status(404).json({ message: 'الخدمة غير موجودة' });
    }

    res.status(200).json({ message: 'تم حذف الخدمة بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'فشل في حذف الخدمة', error: error.message });
  }
};