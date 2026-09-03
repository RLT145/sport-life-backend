const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Nuevo almacenamiento en la nube
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tienda-sportlife', // Así se llamará la carpeta en tu nube
    allowedFormats: ['jpeg', 'png', 'jpg', 'webp']
  },
});

const upload = multer({ storage: storage });

// 1. OBTENER LOS ANUNCIOS (El Catálogo usará esto para mostrarlos)
app.get('/anuncios', async (req, res) => {
  try {
    const anuncios = await prisma.anuncio.findMany({
      orderBy: { createdAt: 'desc' } // Los ordena del más nuevo al más viejo
    });
    res.json(anuncios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los anuncios" });
  }
});

// 2. CREAR UN NUEVO ANUNCIO (El panel de Admin usará esto)
app.post('/anuncios', async (req, res) => {
  try {
    const { titulo, imagenUrl } = req.body;
    const nuevoAnuncio = await prisma.anuncio.create({
      data: {
        titulo,
        imagenUrl: imagenUrl || null, // Por si suben un anuncio sin imagen
        activo: true
      }
    });
    res.json(nuevoAnuncio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el anuncio" });
  }
});

// 3. ELIMINAR UN ANUNCIO (El panel de Admin usará esto para quitarlos)
app.delete('/anuncios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.anuncio.delete({
      where: { id }
    });
    res.json({ message: "Anuncio eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el anuncio" });
  }
});
app.get('/productos', async (req, res) => {
  try {
    const productos = await prisma.producto.findMany({
      orderBy: { id: 'desc' }
    });
    
    const formateados = productos.map(p => ({
      ...p,
      imagenes: p.imagenes ? JSON.parse(p.imagenes) : [p.imagenUrl]
    }));
    res.json(formateados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});


app.post('/productos', upload.array('imagenes', 5), async (req, res) => {
  try {
    const { nombre, marca, genero, categoria, descripcion, precio, talla } = req.body;
    const archivos = req.files;

   let urlsImagenes = [];
        if (archivos && archivos.length > 0) {
          urlsImagenes = archivos.map(file => file.path);
        }

        const imagenPrincipal = urlsImagenes[0] || '';

    const nuevoProducto = await prisma.producto.create({
      data: {
        nombre,
        marca,
        genero: genero || 'Hombre',
        categoria: categoria || 'Calzado',
        descripcion: descripcion || '',
        precio: parseFloat(precio),
        talla,
        imagenUrl: imagenPrincipal,
        imagenes: JSON.stringify(urlsImagenes)
      }
    });

    res.json(nuevoProducto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el producto" });
  }
});

app.put('/productos/:id', upload.array('imagenes', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, marca, genero, categoria, descripcion, precio, talla } = req.body;
    const archivos = req.files;

    let datosActualizados = {
      nombre,
      marca,
      genero: genero || 'Hombre',
      categoria: categoria || 'Calzado',
      descripcion: descripcion || '',
      precio: parseFloat(precio),
      talla
    };

    if (archivos && archivos.length > 0) {
     const urlsImagenes = archivos.map(file => file.path);
      datosActualizados.imagenUrl = urlsImagenes[0];
      datosActualizados.imagenes = JSON.stringify(urlsImagenes);
    }

    const productoActualizado = await prisma.producto.update({
      where: { id: Number(id) },
      data: datosActualizados
    });

    res.json(productoActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el producto" });
  }
});

app.delete('/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.producto.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el producto" });
  }
});


app.get('/ordenes', async (req, res) => {
  try {
    const ordenes = await prisma.orden.findMany({
      orderBy: { id: 'desc' }
    });
    res.json(ordenes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener órdenes" });
  }
});

app.post('/ordenes', async (req, res) => {
  try {
    const { cliente, telefono, direccion, carrito, total } = req.body;
    const nuevaOrden = await prisma.orden.create({
      data: {
        cliente,
        telefono,
        direccion,
        total: parseFloat(total),
       productos: JSON.stringify(carrito),
        codigo: 'SL-' + Math.floor(1000 + Math.random() * 9000) // <-- ¡Generamos y guardamos el código aquí!
      }
    });
    res.json({ success: true, ordenId: nuevaOrden.id, codigo: nuevaOrden.codigo }); // <-- Devolvemos el código
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear la orden" });
  }
});

app.delete('/ordenes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.orden.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar la orden" });
  }
});

app.get('/ordenes', async (req, res) => {
  try {
    const listaOrdenes = await prisma.orden.findMany({
      orderBy: { id: 'desc' }
    });
    res.json(listaOrdenes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las órdenes" });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});
