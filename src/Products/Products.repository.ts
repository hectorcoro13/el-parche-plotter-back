// import { Injectable } from '@nestjs/common';
// import { CreateProductsDTO } from 'src/Users/dto/Create-products-dto';

// export interface Product {
//   id: number;
//   name: string;
//   description: string;
//   price: number;
//   stock: boolean;
//   imgUrl: string;
// }

// @Injectable()
// export class ProductsRepository {
//   Products: Product[] = [
//     {
//       id: 1,
//       name: 'Laptop Gamer',
//       description: 'Una laptop potente para videojuegos.',
//       price: 5000,
//       stock: true,
//       imgUrl:
//         'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba15-spacegray-config-202306?wid=840&hei=508&fmt=jpeg&qlt=90&.v=1684340991372',
//     },
//     {
//       id: 2,
//       name: 'Mouse Inalámbrico',
//       description: 'Mouse ergonómico y sin cables.',
//       price: 50,
//       stock: true,
//       imgUrl: 'https://example.com/mouse-inalambrico.jpg',
//     },
//     {
//       id: 3,
//       name: 'Monitor 4K',
//       description: 'Monitor Ultra HD para profesionales.',
//       price: 700,
//       stock: false,
//       imgUrl: 'https://example.com/monitor-4k.jpg',
//     },
//   ];
//   getProducts() {
//     return this.Products;
//   }
//   getProductsByid(id: number) {
//     return this.Products.find((products) => products.id === id);
//   }
//   createProducts(products: CreateProductsDTO) {
//     const newProducts: Product = {
//       id: this.Products[this.Products.length - 1].id + 1,
//       ...products,
//     };
//     this.Products.push(newProducts);
//     return newProducts;
//   }
//   UpdateProducts(id: number, products: Partial<Product>) {
//     const index = this.Products.findIndex((products) => products.id === id);
//     if (index === -1) {
//       return 'No hay tal';
//     }
//     this.Products[index] = products as Product;
//     return products;
//   }
//   deleteProducts(id: number) {
//     const deleteProducts = this.Products.filter((Element) => Element.id !== id);
//     this.Products = deleteProducts;
//     return this.Products;
//   }
// }
