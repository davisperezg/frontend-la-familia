import {
  ChangeEvent,
  FormEvent,
  memo,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert, Button, Col, Form, Modal, Row } from "react-bootstrap";
import { postCreateClient, updateClient } from "../../../api/client/client";
import { IAlert } from "../../../interface/IAlert";
import { Client } from "../../../interface/Client";
import { AuthContext } from "../../../context/auth";
import { useLocation } from "react-router-dom";
import { getModuleByMenu } from "../../../api/module/module";
import { getServiceData } from "../../../api/identify";

type InputChange = ChangeEvent<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
>;

const ClientForm = ({
  show,
  client,
  closeModal,
  listClients,
}: {
  show: boolean;
  client?: Client;
  closeModal: () => void;
  listClients: () => void;
}) => {
  const initialStateClient: Client = {
    name: "",
    lastname: "",
    tipDocument: "",
    nroDocument: "",
    email: "",
    cellphone: "",
    address: "",
  };

  const initialStateAlert: IAlert = {
    type: "",
    message: "",
  };

  const [form, setForm] = useState<Client>(initialStateClient);
  const [message, setMessage] = useState<IAlert>(initialStateAlert);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [errors, setErrors] = useState<any>({});
  const { resources } = useContext(AuthContext);
  const location = useLocation();
  const getNameLocation = location.pathname.slice(1);
  const [resource, setResource] = useState<any>(null);

  const getMyModule = useCallback(async () => {
    const mymodule = await getModuleByMenu(getNameLocation);
    const findResource = resources.find(
      (res: any) => res.module.name === mymodule.data.name
    );
    setResource(findResource);
  }, [resources, getNameLocation]);

  const closeAndClear = () => {
    setForm(initialStateClient);
    closeModal();
    setMessage(initialStateAlert);
    setErrors({});
  };

  const findFormErrors = () => {
    const { name, lastname, tipDocument, nroDocument } = form;
    const newErrors: any = {};
    // name errors
    if (!name || name === "") newErrors.name = "Por favor ingrese el nombre.";
    if (!lastname || lastname === "")
      newErrors.lastname = "Por favor ingrese el apellido.";
    if (!tipDocument || tipDocument === "")
      newErrors.tipDocument = "Por favor seleccione el tipo de documento.";

    if (!nroDocument || nroDocument === "")
      newErrors.nroDocument = "Por favor ingrese nro de documento.";
    else if (!nroDocument || nroDocument.length < 8 || nroDocument.length > 11)
      newErrors.nroDocument =
        "Por favor ingrese el nro de documento de 8 - 11 caracteres";

    return newErrors;
  };

  const handleChange = (e: InputChange) => {
    setMessage(initialStateAlert);
    if (!!errors[e.target.name])
      setErrors({
        ...errors,
        [e.target.name]: null,
      });
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e: FormEvent | any) => {
    e.preventDefault();
    const newErrors = findFormErrors();

    if (Object.keys(newErrors).length > 0) {
      // We got errors!
      setErrors(newErrors);
    } else {
      setDisabled(true);
      if (form?._id) {
        if (resource && resource.canUpdate) {
          try {
            const res = await updateClient(form!._id, form);
            const { clientUpdated } = res.data;
            setMessage({
              type: "success",
              message: `El cliente ${clientUpdated.name} ha sido actualizado existosamente.`,
            });
            setDisabled(false);
            listClients();
          } catch (e) {
            setDisabled(false);
            const error: any = e as Error;
            const msg = error.response.data;
            setMessage({ type: "danger", message: msg.message });
          }
        } else {
          setMessage({
            type: "danger",
            message: "No tienes acceso a este recurso.",
          });
          setDisabled(false);
          return;
        }
      } else {
        if (resource && resource.canCreate) {
          try {
            const res = await postCreateClient(form);
            const { client } = res.data;
            setMessage({
              type: "success",
              message: `El cliente ${client.name} ha sido registrado existosamente.`,
            });
            setForm(initialStateClient);
            setDisabled(false);
            listClients();
          } catch (e) {
            setDisabled(false);
            const error: any = e as Error;
            const msg = error.response.data;
            setMessage({ type: "danger", message: msg.message });
          }
        } else {
          setMessage({
            type: "danger",
            message: "No tienes acceso a este recurso.",
          });
          setDisabled(false);
          return;
        }
      }
      setErrors({});
    }
  };

  const getClient = useCallback(() => {
    if (client?._id) {
      setForm({
        _id: client?._id,
        name: client?.name,
        lastname: client?.lastname,
        tipDocument: client?.tipDocument,
        nroDocument: client?.nroDocument,
        email: client?.email,
        cellphone: client?.cellphone,
        address: client?.address,
      });
    }
  }, [
    client?._id,
    client?.name,
    client?.lastname,
    client?.tipDocument,
    client?.nroDocument,
    client?.email,
    client?.cellphone,
    client?.address,
  ]);

  useEffect(() => {
    getClient();
    getMyModule();
  }, [getClient, getMyModule]);

  return (
    <Modal
      show={show}
      onHide={closeAndClear}
      backdrop="static"
      keyboard={false}
      top="true"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {form?._id ? "Editar Cliente" : "Crear Cliente"}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={onSubmit}>
        <Modal.Body>
          {message.type && (
            <Alert variant={message.type}>{message.message}</Alert>
          )}
          <Form.Group className="mb-3" as={Col} controlId="formGridTip">
            <Form.Label>
              Tipo de documento <strong className="text-danger">*</strong>
            </Form.Label>
            <Form.Select
              name="tipDocument"
              onChange={(e) => {
                setForm({
                  ...form,
                  tipDocument: e.target.value,
                  nroDocument: "",
                  name: "",
                  lastname: "",
                });
              }}
              value={form?.tipDocument}
              isInvalid={!!errors?.tipDocument}
            >
              <option value="">[Seleccione el documento]</option>
              <option value="OTRO">OTRO</option>
              <option value="DNI">DNI</option>
              <option value="RUC">RUC</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errors?.tipDocument}
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" as={Col} controlId="formGridNro">
            <Form.Label>
              Nro de documento <strong className="text-danger">*</strong>
            </Form.Label>
            <Form.Control
              name="nroDocument"
              maxLength={form.tipDocument === "DNI" ? 8 : 11}
              minLength={form.tipDocument === "DNI" ? 8 : 11}
              onKeyUp={async (e: any) => {
                if (
                  form.tipDocument === "DNI" &&
                  Number(e.target.value.length) === 8
                ) {
                  try {
                    const res = await getServiceData(
                      String(form.tipDocument).toLowerCase(),
                      e.target.value
                    );
                    const { nombres, apellidoPaterno, apellidoMaterno } =
                      res.data;
                    setForm({
                      ...form,
                      name: nombres,
                      lastname: apellidoPaterno + " " + apellidoMaterno,
                    });
                  } catch (e) {
                    alert(
                      "Ha ocurrido un error. Verifique el Nro de documento o borre el nro de documento y vuelva a ingresarlo, si el error persiste ingrese el nombre/razon o apellido/estado del cliente manualmente. Gracias."
                    );
                  }
                }
                if (
                  form.tipDocument === "RUC" &&
                  Number(e.target.value.length) === 11
                ) {
                  try {
                    const res = await getServiceData(
                      String(form.tipDocument).toLowerCase(),
                      e.target.value
                    );
                    const { nombre, estado } = res.data;
                    setForm({
                      ...form,
                      name: nombre,
                      lastname: estado,
                    });
                  } catch (e) {
                    alert(
                      "Ha ocurrido un error. Borre el nro de documento y vuelva a ingresarlo, si el error persiste ingrese el nombre/razon o apellido/estado del usuario manualmente. Gracias"
                    );
                  }
                }
              }}
              onChange={(e) => {
                setForm({
                  ...form,
                  nroDocument: e.target.value,
                  name: "",
                  lastname: "",
                });
              }}
              value={form?.nroDocument}
              type="text"
              placeholder="Introduce Nro. de documento"
              isInvalid={!!errors?.nroDocument}
            />
            <Form.Control.Feedback type="invalid">
              {errors?.nroDocument}
            </Form.Control.Feedback>
          </Form.Group>
          <Row className="mb-3">
            <Form.Group as={Col} controlId="formGridName">
              <Form.Label>
                {form.tipDocument === "RUC" ? "Razón social" : "Nombres"}{" "}
                <strong className="text-danger">*</strong>
              </Form.Label>
              <Form.Control
                name="name"
                onChange={handleChange}
                value={form?.name}
                type="text"
                placeholder={
                  form.tipDocument === "RUC"
                    ? "Introduce razón social"
                    : "Introduce nombre(s)"
                }
                isInvalid={!!errors?.name}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.name}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group as={Col} controlId="formGridLastname">
              <Form.Label>
                {form.tipDocument === "RUC" ? "Razón social" : "Apellidos"}{" "}
                <strong className="text-danger">*</strong>
              </Form.Label>
              <Form.Control
                name="lastname"
                onChange={handleChange}
                value={form?.lastname}
                type="text"
                placeholder={
                  form.tipDocument === "RUC"
                    ? "Introduce estado de ruc"
                    : "Introduce apellido(s)"
                }
                isInvalid={!!errors?.lastname}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.lastname}
              </Form.Control.Feedback>
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col} controlId="formGridEmail">
              <Form.Label>Correo</Form.Label>
              <Form.Control
                name="email"
                onChange={handleChange}
                value={form?.email}
                type="text"
                placeholder="Introduce correo"
                isInvalid={!!errors?.email}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.email}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group as={Col} controlId="formGridLastname">
              <Form.Label>Celular</Form.Label>
              <Form.Control
                name="cellphone"
                onChange={handleChange}
                value={form?.cellphone}
                type="text"
                placeholder="Introduce celular"
                isInvalid={!!errors?.cellphone}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.cellphone}
              </Form.Control.Feedback>
            </Form.Group>
          </Row>
          <Form.Group className="mb-3" as={Col} controlId="formGridAddress">
            <Form.Label>Dirección</Form.Label>
            <Form.Control
              name="address"
              onChange={handleChange}
              value={form?.address}
              type="text"
              placeholder="Introduce dirección"
              isInvalid={!!errors?.address}
            />
            <Form.Control.Feedback type="invalid">
              {errors?.address}
            </Form.Control.Feedback>
          </Form.Group>
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

export default memo(ClientForm);
