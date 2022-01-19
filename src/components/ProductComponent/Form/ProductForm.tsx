import { IAlert } from "../../../interface/IAlert";
import { Product } from "../../../interface/Product";
import { Modal, Form, Button, Alert, Row, Col } from "react-bootstrap";
import {
  memo,
  useCallback,
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
} from "react";
import { Mark } from "../../../interface/Mark";
import { Model } from "../../../interface/Model";
import { Unit } from "../../../interface/Unit";
import { postCreateProduct, updateProduct } from "../../../api/product/product";
import { getMarks } from "../../../api/mark/mark";
import Select from "react-select";
import { getModels } from "../../../api/model/model";
import makeAnimated from "react-select/animated";
import { getUnits } from "../../../api/unit/unit";

const animatedComponents = makeAnimated();

type InputChange = ChangeEvent<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
>;

const ProductForm = ({
  show,
  product,
  closeModal,
  listProducts,
}: {
  show: boolean;
  product?: Product;
  closeModal: () => void;
  listProducts: () => void;
}) => {
  const initialStateProduct: Product = {
    name: "",
    mark: "",
    model: "",
    unit: "",
    stock: 0,
    price: 0,
    cod_internal: "",
    note: "",
  };

  const initialState: IAlert = {
    type: "",
    message: "",
  };

  const [form, setForm] = useState<Product>(initialStateProduct);
  const [message, setMessage] = useState<IAlert>(initialState);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [errors, setErrors] = useState<any>({});

  const closeAndClear = () => {
    setForm(initialStateProduct);
    closeModal();
    setMessage(initialState);
    setErrors({});
  };

  const listMarks = async () => {
    const res = await getMarks();
    const { data } = res;
    const filter = data.map((mod: any) => {
      return {
        label: mod.name,
        value: mod.name,
      };
    });
    setMarks(filter);
  };

  const listModels = async () => {
    const res = await getModels();
    const { data } = res;
    const filter = data.map((mod: any) => {
      return {
        label: mod.name,
        value: mod.name,
      };
    });
    setModels(filter);
  };

  const listUnits = async () => {
    const res = await getUnits();
    const { data } = res;
    const filter = data.map((mod: any) => {
      return {
        label: mod.name,
        value: mod.name,
      };
    });
    setUnits(filter);
  };

  const handleChange = (e: InputChange) => {
    setMessage(initialState);
    // Check and see if errors exist, and remove them from the error object:
    if (errors[e.target.name])
      setErrors({
        ...errors,
        [e.target.name]: null,
      });
    setForm({
      ...form,
      [e.target.name]:
        e.target.name === "stock" ? Number(e.target.value) : e.target.value,
    });
  };

  const findFormErrors = () => {
    const { name, mark, model, unit, stock, price } = form;

    const newErrors: any = {};
    console.log(stock < 0 ? true : false);

    if (!name || name === "") newErrors.name = "Por favor ingrese el nombre.";
    if (!mark || mark === "") newErrors.mark = "Por favor seleccione la marca.";
    if (!model || model === "")
      newErrors.model = "Por favor seleccione el modelo.";
    if (!unit || unit === "")
      newErrors.unit = "Por favor seleccione la unidad de medida.";
    if (stock < 0) newErrors.stock = "Por favor un stock valido.";
    if (price < 0) newErrors.price = "Por favor un stock valido.";
    // else if (!nroDocument || nroDocument.length < 8 || nroDocument.length > 11)
    //   newErrors.nroDocument =
    //     "Por favor ingrese el nro de documento de 8 - 11 caracteres";

    // if (!email || email === "")
    //   newErrors.email = "Por favor ingrese el correo.";
    // if (!username || username === "")
    //   newErrors.username = "Por favor ingrese el usuario.";
    // if (!password || password === "")
    //   newErrors.password = "Por favor ingrese la contraseña.";
    // else if (!password || password.length < 6)
    //   newErrors.password =
    //     "Por favor ingrese la contraseña mayor a 5 caracteres";

    return newErrors;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const newErrors = findFormErrors();

    if (Object.keys(newErrors).length > 0) {
      // We got errors!
      setErrors(newErrors);
    } else {
      setDisabled(true);
      if (form?._id) {
        try {
          const res = await updateProduct(form!._id, form);
          const { productUpdated } = res.data;
          setMessage({
            type: "success",
            message: `El producto ${productUpdated.name} ha sido actualizado existosamente.`,
          });
          setDisabled(false);
          listProducts();
        } catch (e) {
          setDisabled(false);
          const error: any = e as Error;
          const msg = error.response.data;
          setMessage({ type: "danger", message: msg.message });
        }
      } else {
        try {
          const res = await postCreateProduct(form);
          const { product } = res.data;
          setMessage({
            type: "success",
            message: `El producto ${product.name} ha sido registrado existosamente.`,
          });
          setForm(initialStateProduct);
          setDisabled(false);
          listProducts();
        } catch (e) {
          setDisabled(false);
          const error: any = e as Error;
          const msg = error.response.data;
          setMessage({ type: "danger", message: msg.message });
        }
      }
      setErrors(newErrors);
    }
  };

  const getProduct = useCallback(() => {
    if (product?._id) {
      setForm({
        _id: product?._id,
        name: product?.name,
        cod_internal: product?.cod_internal,
        note: product?.note,
        mark: product?.mark,
        model: product?.model,
        unit: product?.unit,
        stock: product?.stock,
        price: product?.price,
      });
    }
  }, [
    product?._id,
    product?.name,
    product?.cod_internal,
    product?.note,
    product?.mark,
    product?.model,
    product?.unit,
    product?.stock,
    product?.price,
  ]);

  useEffect(() => {
    listMarks();
    listModels();
    listUnits();
    getProduct();
  }, [getProduct]);

  return (
    <Modal
      show={show}
      onHide={closeAndClear}
      backdrop="static"
      keyboard={false}
      top="true"
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {form?._id ? "Editar Producto" : "Crear Producto"}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={onSubmit}>
        <Modal.Body>
          {message.type && (
            <Alert variant={message.type}>{message.message}</Alert>
          )}

          <Row className="mb-3">
            <Form.Group as={Col} controlId="formGridName">
              <Form.Label>Nombres</Form.Label>
              <Form.Control
                name="name"
                onChange={handleChange}
                value={form?.name}
                type="text"
                placeholder="Introduce nombre"
                isInvalid={!!errors?.name}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.name}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group as={Col} controlId="formGridCodInternal">
              <Form.Label>Codigo barra / interno</Form.Label>
              <Form.Control
                name="cod_internal"
                onChange={handleChange}
                value={form?.cod_internal}
                type="text"
                placeholder="Introduce codigo barra / interno"
              />
            </Form.Group>
          </Row>
          <Form.Group className="mb-3" controlId="formGridNote">
            <Form.Label>Nota</Form.Label>
            <Form.Control
              as="textarea"
              name="note"
              onChange={handleChange}
              value={form?.note}
              isInvalid={!!errors?.note}
              placeholder="Introduce una nota"
            />
            <Form.Control.Feedback type="invalid">
              {errors?.note}
            </Form.Control.Feedback>
          </Form.Group>
          <Row className="mb-3">
            <Form.Group as={Col} controlId="formGridMark">
              <Form.Label>Marca</Form.Label>
              <Form.Control
                name="mark"
                type="hidden"
                isInvalid={!!errors?.mark}
              />
              <Select
                placeholder="[Seleccione marca]"
                closeMenuOnSelect={true}
                components={animatedComponents}
                value={
                  form.mark === "" ? [] : { label: form.mark, value: form.mark }
                }
                onChange={(values: any) => {
                  const { value } = values;
                  setForm({ ...form, mark: value });
                  setErrors({
                    ...errors,
                    mark: null,
                  });
                }}
                options={marks}
              />

              <Form.Control.Feedback type="invalid">
                {errors?.mark}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group as={Col} controlId="formGridModel">
              <Form.Label>Modelo</Form.Label>
              <Form.Control
                name="model"
                type="hidden"
                isInvalid={!!errors?.model}
              />
              <Select
                placeholder="[Seleccione marca]"
                closeMenuOnSelect={true}
                components={animatedComponents}
                value={
                  form.model === ""
                    ? []
                    : { label: form.model, value: form.model }
                }
                onChange={(values: any) => {
                  const { value } = values;
                  setForm({ ...form, model: value });
                  setErrors({
                    ...errors,
                    model: null,
                  });
                }}
                options={models}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.model}
              </Form.Control.Feedback>
            </Form.Group>
          </Row>
          <Form.Group className="mb-3" as={Col} controlId="formGridUnit">
            <Form.Label>Unidad de medida</Form.Label>
            <Form.Control
              name="unit"
              type="hidden"
              isInvalid={!!errors?.unit}
            />
            <Select
              placeholder="[Seleccione unidad de medida]"
              closeMenuOnSelect={true}
              components={animatedComponents}
              value={
                form.unit === "" ? [] : { label: form.unit, value: form.unit }
              }
              onChange={(values: any) => {
                const { value } = values;
                setForm({ ...form, unit: value });
                setErrors({
                  ...errors,
                  unit: null,
                });
              }}
              options={units}
            />
            <Form.Control.Feedback type="invalid">
              {errors?.unit}
            </Form.Control.Feedback>
          </Form.Group>
          <Row className="mb-3">
            <Form.Group as={Col} controlId="formGridStock">
              <Form.Label>Stock</Form.Label>
              <Form.Control
                name="stock"
                type="number"
                onChange={handleChange}
                value={form?.stock}
                isInvalid={!!errors?.stock}
                placeholder="Introduce un stock"
              />
              <Form.Control.Feedback type="invalid">
                {errors?.stock}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group as={Col} controlId="formGridStock">
              <Form.Label>Precio</Form.Label>
              <Form.Control
                name="price"
                type="number"
                step="0.01"
                onChange={handleChange}
                value={form?.price}
                isInvalid={!!errors?.price}
                placeholder="Introduce un precio"
              />
              <Form.Control.Feedback type="invalid">
                {errors?.price}
              </Form.Control.Feedback>
            </Form.Group>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeAndClear}>
            Cerrar
          </Button>
          <Button type="submit" variant="primary" disabled={disabled}>
            {form?._id ? "Actualizar" : "Registrar"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default memo(ProductForm);
