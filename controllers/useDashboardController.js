import Booking from '../models/Booking.js';
import Service from '../models/Service.js';


export const getTotalBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer les services créés par ce user (worker)
    const services = await Service.find({ createdBy: userId }).select('_id');
    const serviceIds = services.map(service => service._id);

    // Compter les bookings associés à ces services
    const total = await Booking.countDocuments({ service: { $in: serviceIds } });

    res.status(200).json({ totalBookings: total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to calculate the number of reservations', error: err.message });
  }
};


export const getAverageRating = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer tous les services créés par l'utilisateur (worker)
    const services = await Service.find({ createdBy: userId }, { _id: 1 });

    const serviceIds = services.map(service => service._id);

    // Calculer la moyenne des notes sur les réservations associées à ces services
    const result = await Booking.aggregate([
      {
        $match: {
          service: { $in: serviceIds },
          rating: { $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" }
        }
      }
    ]);

    const avg = result[0]?.averageRating || 0;

    res.status(200).json({ averageRating: avg.toFixed(2) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to calculate average rating', error: err.message });
  }
};


export const getMostDemandedService = async (req, res) => {
  try {
    const userId = req.user.id;

    // Trouver tous les services créés par ce worker
    const services = await Service.find({ createdBy: userId }, { _id: 1, title: 1 });
    const serviceIds = services.map(service => service._id);

    const result = await Booking.aggregate([
      { $match: { service: { $in: serviceIds } } },
      { $group: { _id: "$service", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "services",
          localField: "_id",
          foreignField: "_id",
          as: "service"
        }
      },
      { $unwind: "$service" }
    ]);

    if (result.length === 0) {
      return res.status(200).json({ mostDemandedService: null });
    }

    res.status(200).json({
      mostDemandedService: result[0].service.title,
      count: result[0].count
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to extract the most requested service', error: err.message });
  }
};


export const getRecentReviews = async (req, res) => {
  try {
    const userId = req.user.id;

    // Trouver les services créés par cet utilisateur
    const services = await Service.find({ createdBy: userId }, { _id: 1 });
    const serviceIds = services.map(service => service._id);

    // Rechercher les réservations liées à ces services avec des notes
    const bookings = await Booking.find({
      service: { $in: serviceIds },
      rating: { $ne: null }
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('user', 'fullName');

    const reviews = bookings.map(b => ({
      customer: b.user?.fullName || 'Unknown',
      rating: b.rating,
      review: b.review
    }));

    res.status(200).json({ reviews });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get reviews', error: err.message });
  }
}; 
   

export const getMonthlyBookingsStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer les services créés par cet utilisateur
    const services = await Service.find({ createdBy: userId }, { _id: 1 });
    const serviceIds = services.map(service => service._id);

    // Agréger les réservations selon le mois
    const stats = await Booking.aggregate([
      {
        $match: {
          service: { $in: serviceIds },
          createdAt: {
            $gte: new Date(new Date().getFullYear(), 0, 1) // début de l'année
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Générer un tableau pour les 12 mois avec des zéros par défaut
    const monthlyStats = Array.from({ length: 12 }, (_, i) => {
      const monthStat = stats.find(s => s._id === i + 1);
      return { month: i + 1, total: monthStat?.total || 0 };
    });

    res.status(200).json({ monthlyStats });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to extract monthly statistics',
      error: err.message
    });
  }
};
    


export const getWorkerStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Trouver tous les services créés par cet utilisateur
    const services = await Service.find({ createdBy: userId }, { _id: 1 });
    const serviceIds = services.map(service => service._id);

    // Statistiques des réservations
    const totalBookings = await Booking.countDocuments({ service: { $in: serviceIds } });
    const completedBookings = await Booking.countDocuments({ service: { $in: serviceIds }, status: 'done' });
    const pendingBookings = await Booking.countDocuments({ service: { $in: serviceIds }, status: 'pending' });

    // Notes moyennes
    const reviews = await Booking.find(
      { service: { $in: serviceIds }, rating: { $exists: true, $ne: null } },
      'rating'
    );
    const averageRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    res.status(200).json({ totalBookings, completedBookings, pendingBookings, averageRating });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get stats', error: err.message });
  }
};



export const getWorkerBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer les services créés par cet utilisateur
    const services = await Service.find({ createdBy: userId }, { _id: 1 });
    const serviceIds = services.map(service => service._id);

    // Trouver les réservations liées à ces services
    const bookings = await Booking.find({ service: { $in: serviceIds } })
      .populate('user', 'fullName email')
      .populate('service', 'name');

    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bookings', error: err.message });
  }
};


export const getWorkerReviews = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer les services créés par cet utilisateur
    const services = await Service.find({ createdBy: userId }, { _id: 1 });
    const serviceIds = services.map(service => service._id);

    // Récupérer les réservations associées avec des avis
    const reviews = await Booking.find({
      service: { $in: serviceIds },
      review: { $exists: true },
    })
    .populate('user', 'fullName')
    .populate('service', 'name');

    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch reviews', error: err.message });
  }
};


export const getWorkerServices = async (req, res) => {
  try {
    const userId = req.user.id;

    const services = await Service.find({ createdBy: userId });

    res.status(200).json(services);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch services', error: err.message });
  }
};



export const getWorkerDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer les IDs des services créés par ce user
    const services = await Service.find({ createdBy: userId }, '_id');
    const serviceIds = services.map(s => s._id);

    if (serviceIds.length === 0) {
      return res.status(200).json({
        statusCounts: [],
        avgRating: 0,
        totalEarnings: 0
      });
    }

    // Nombre de réservations par statut
    const statusCounts = await Booking.aggregate([
      { $match: { service: { $in: serviceIds } } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Moyenne des évaluations
    const avgRatingResult = await Booking.aggregate([
      { $match: { service: { $in: serviceIds }, rating: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } }
    ]);
    const avgRating = avgRatingResult[0]?.avgRating || 0;

    // Total des gains (sur les réservations terminées)
    const totalEarningsResult = await Booking.aggregate([
      { $match: { service: { $in: serviceIds }, status: "done" } },
      { $group: { _id: null, total: { $sum: "$price" } } }
    ]);
    const totalEarnings = totalEarningsResult[0]?.total || 0;

    res.status(200).json({
      statusCounts,
      avgRating: avgRating.toFixed(1),
      totalEarnings
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard stats", error: error.message });
  }
};




export const filterWorkerReviewsByRating = async (req, res) => {
  try {
    const userId = req.user.id;
    const minRating = parseInt(req.query.minRating) || 0;

    // Récupérer les services créés par le user (worker)
    const services = await Service.find({ createdBy: userId }, '_id');
    const serviceIds = services.map(s => s._id);

    if (serviceIds.length === 0) {
      return res.status(200).json([]); // Aucun service => aucune review
    }

    // Filtrer les bookings qui ont une note >= minRating
    const reviews = await Booking.find({
      service: { $in: serviceIds },
      rating: { $gte: minRating }
    }, "rating review status").populate('user', 'fullName');

    res.status(200).json(reviews);
    
  } catch (error) {
    res.status(500).json({ message: "Failed to filter reviews", error: error.message });
  }
};




export const getWorkerBookingsByStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const status = req.params.status;

    // Trouver les services créés par le worker
    const services = await Service.find({ createdBy: userId }, '_id');
    const serviceIds = services.map(s => s._id);

    if (serviceIds.length === 0) {
      return res.status(200).json([]); // Pas de services => pas de bookings
    }

    // Trouver les bookings associés à ces services avec le statut donné
    const bookings = await Booking.find({
      service: { $in: serviceIds },
      status: status
    }).populate('user', 'fullName email');

    res.status(200).json(bookings);

  } catch (error) {
    res.status(500).json({ message: "Failed to get bookings by status", error: error.message });
  }
};




export const getWorkerBookingCountsByMonth = async (req, res) => {
  try {
    const userId = req.user.id;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Récupérer les services créés par ce worker
    const services = await Service.find({ createdBy: userId }, '_id');
    const serviceIds = services.map(s => s._id);

    if (serviceIds.length === 0) {
      return res.status(200).json([]); // pas de services => pas de réservations
    }

    const counts = await Booking.aggregate([
      {
        $match: {
          service: { $in: serviceIds },
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.status(200).json(counts);
  } catch (error) {
    res.status(500).json({ message: "Failed to get booking counts by month", error: error.message });
  }
};


// جلب الحجوزات الجديدة القادمة للعامل (التي في حالة "pending") rahy pending defulr

export const getIncomingBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Trouver les services du worker
    const services = await Service.find({ createdBy: userId }, '_id');
    const serviceIds = services.map(s => s._id);

    if (serviceIds.length === 0) {
      return res.status(200).json([]); // Pas de services = pas de réservations
    }

    // Trouver les bookings en status "pending" pour ces services
    const bookings = await Booking.find({ 
      service: { $in: serviceIds },
      status: "pending"
    }).populate("user", 'fullName email');

    res.status(200).json(bookings);

  } catch (error) {
    res.status(500).json({ message: "Failed to get incoming bookings", error: error.message });
  }
};
