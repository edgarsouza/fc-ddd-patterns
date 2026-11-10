import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", "123", [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

  it("should find an order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    customer.changeAddress(new Address("Street 1", 1, "Zipcode 1", "City 1"));
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product)

    const orderItem = new OrderItem("1", product.name, product.price, product.id, 2);
    const order = new Order("123", "123", [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const foundOrder = await orderRepository.find(order.id);

    expect(foundOrder).toStrictEqual(order);
  });

  it("should thown an error when order is not found", async () => {
    const orderRepository = new OrderRepository();

    await expect(orderRepository.find("456")).rejects.toThrow("Order not found");
  });

  it("should find all orders", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    customer.changeAddress(new Address("Street 1", 1, "Zipcode 1", "City 1"));
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = [
      new Product("123", "Produtct 1", 10),
      new Product("432", "Produtct 2", 20)
    ];

    for (var index in product){
      await productRepository.create(product[index]);
    }

    const orderItem = [
      new OrderItem("1", product[0].name, product[0].price, product[0].id, 3),
      new OrderItem("2", product[1].name, product[1].price, product[1].id, 1),
    ];

    /* Order 1 */
    const order = new Order("111", "123", orderItem);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    /* Order 2 */
    const orderItems = new OrderItem("3", product[0].name, product[0].price, product[0].id, 2);

    const order2 = new Order("222", "123", [orderItems]);

    await orderRepository.create(order2);

    const orders = await orderRepository.findAll();

    expect(orders).toHaveLength(2);
    expect(orders).toContainEqual(order);
    expect(orders).toContainEqual(order2);

  });

  it("should edit an order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Produtct 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", "123", [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    /* Edição */
    const orderItemEdit = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      5
    );

    const orderEdit = new Order("123", "123", [orderItemEdit]);

    await orderRepository.update(orderEdit);

    const orderModel = await OrderModel.findOne({
      where: { id: orderEdit.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: orderEdit.total(),
      items: [
        {
          id: orderItemEdit.id,
          name: orderItemEdit.name,
          price: orderItemEdit.price,
          quantity: orderItemEdit.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });

  });

});
