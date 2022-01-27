import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Modal,
  Table,
  Form,
  Row,
  Col,
} from "react-bootstrap";
import TableHeader from "../../../components/DatatableComponent/Header/TableHeader";
import { Fact } from "../../../interface/Fact";
import { InputChange } from "../../../lib/types/types";
import { getFactByRange } from "../../../api/fact/fact";
import FactListActives from "../../../components/FactComponent/List/Actives/FactListActives";
import PaginationComponent from "../../../components/DatatableComponent/Pagination/Pagination";
import FactForm from "../../../components/FactComponent/Form/FactForm";

const headers = [
  { name: "#", field: "item", sortable: false },
  { name: "Cod", field: "cod_fact", sortable: true },
  { name: "Fecha", field: "createdAt", sortable: true },
  { name: "Cliente", field: "client", sortable: true },
  { name: "Vendedor", field: "user", sortable: true },
  { name: "Tipo de pago", field: "payment_type", sortable: true },
  { name: "Forma de pago", field: "way_to_pay", sortable: true },
  { name: "Total", field: "subtotal", sortable: true },
  { name: "Estado", field: "status", sortable: false },
  {
    name: "Eliminar",
    field: "delete",
    sortable: false,
  },
];

const ConsultFactScreen = () => {
  const [sorting, setSorting] = useState({ field: "", order: "" });
  const [facts, setFacts] = useState<Fact[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [show, setShow] = useState(false);
  const [state, setState] = useState<any>();
  const [totalItems, setTotalItems] = useState(0);
  const [consult, setConsult] = useState({
    start: "",
    end: "",
  });
  const ITEMS_PER_PAGE = 10;

  const onSorting = (field: string, order: string) =>
    setSorting({ field, order });

  const handleChange = (e: InputChange) => {
    setConsult({ ...consult, [e.target.name]: e.target.value });
  };

  const goSearch = async () => {
    setCurrentPage(1);
    const { start, end } = consult;
    const res = await getFactByRange(start, end);
    const filter = res.data.map((fact: any) => {
      return {
        _id: fact._id,
        cod_fact: fact.cod_fact,
        createdAt: fact.createdAt,
        client: fact.client.name + " " + fact.client.lastname,
        user: fact?.user.name + " " + fact.user.lastname,
        payment_type: fact.payment_type,
        way_to_pay: fact.way_to_pay,
        subtotal: fact.subtotal,
        discount: fact.discount,
        status: fact.status,
        customer_payment: fact.customer_payment,
      };
    });
    setFacts(filter);
  };

  const factsFiltered = useMemo(() => {
    let computedFacts: any = facts;

    setTotalItems(computedFacts.length);

    //Sorting comments
    if (sorting.field) {
      const reversed = sorting.order === "asc" ? 1 : -1;
      computedFacts = computedFacts
        .map((format: any) => {
          return {
            ...format,
            subtotal: format.subtotal - format.discount,
          };
        })
        .sort((a: any, b: any) => {
          if (typeof a[sorting.field] === "object") {
            return (
              reversed *
              a[sorting.field].name
                .toString()
                .localeCompare(b[sorting.field].name.toString())
            );
          } else {
            if (typeof a[sorting.field] === "number") {
              return reversed * (a[sorting.field] - b[sorting.field]);
            } else {
              return (
                reversed *
                a[sorting.field]
                  .toString()
                  .localeCompare(b[sorting.field].toString())
              );
            }
          }
        });
    }

    return computedFacts.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      (currentPage - 1) * ITEMS_PER_PAGE + ITEMS_PER_PAGE
    );
  }, [facts, sorting, currentPage]);

  const openModalRE = useCallback((props: boolean, value?: any) => {
    setShow(true);
    if (props) {
      setState(value);
    }
  }, []);

  const onPageChange = (page: number) => setCurrentPage(page);

  const closeModal = useCallback(() => {
    setShow(false);
    setState({});
  }, []);

  return (
    <Card>
      <FactForm show={show} closeModal={closeModal} fact={state} />
      <Card.Header as="h5">Consulta de ventas</Card.Header>
      <Card.Body>
        <Row className="mb-3">
          <Form.Group md="3" as={Col} controlId="formGridStart">
            <Form.Label>Consultar desde:</Form.Label>
            <Form.Control name="start" type="date" onChange={handleChange} />
          </Form.Group>
          <Form.Group md="3" as={Col} controlId="formGridEnd">
            <Form.Label>Consultar hasta:</Form.Label>
            <Form.Control name="end" type="date" onChange={handleChange} />
          </Form.Group>
          <Form.Group md="2" as={Col} controlId="formGridFech">
            <Form.Label>Buscar</Form.Label>
            <Button
              type="button"
              variant="primary"
              className="w-100"
              onClick={goSearch}
            >
              Consultar
            </Button>
          </Form.Group>
        </Row>
        <div
          className="mb-3"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <PaginationComponent
            total={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            currentPage={currentPage}
            onPageChange={onPageChange}
          />
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <span style={{ marginLeft: 5 }}>
              Se encontraron un total de {facts.length} registros
            </span>
          </div>
        </div>
        <Table striped bordered hover responsive="sm">
          <TableHeader headers={headers} onSorting={onSorting} />
          <tbody>
            {factsFiltered.map((fact: any, i: number) => (
              <FactListActives
                key={fact._id}
                item={i}
                fact={fact}
                openModalRE={openModalRE}
              />
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default ConsultFactScreen;