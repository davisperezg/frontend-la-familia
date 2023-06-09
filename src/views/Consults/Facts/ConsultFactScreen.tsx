import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Table, Form, Row, Col } from "react-bootstrap";
import TableHeader from "../../../components/DatatableComponent/Header/TableHeader";
import { Fact } from "../../../interface/Fact";
import { InputChange } from "../../../lib/types/types";
import { getFactByRange } from "../../../api/fact/fact";
import FactListActives from "../../../components/FactComponent/List/Actives/FactListActives";
import PaginationComponent from "../../../components/DatatableComponent/Pagination/Pagination";
import FactForm from "../../../components/FactComponent/Form/FactForm";
import useResource from "../../../hooks/resource/resourceHook";
import { IAlert } from "../../../interface/IAlert";
import { formatter } from "../../../lib/helpers/functions/functions";
import { getAreas } from "../../../api/area/area";
import { Area } from "../../../interface/Area";
import ItemCheck from "./ItemCheck";
import { AuthContext } from "../../../context/auth";
import { CSVLink } from "react-csv";
import {
  getDetailsByIdFact,
  getDetailsFacts,
} from "../../../api/detail-fact/detail";

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
];

const initialStateAlert: IAlert = {
  type: "",
  message: "",
};

const ConsultFactScreen = () => {
  const [sorting, setSorting] = useState({ field: "", order: "" });
  const [facts, setFacts] = useState<Fact[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [show, setShow] = useState(false);
  const [state, setState] = useState<any>();
  const [totalItems, setTotalItems] = useState(0);
  const [consult, setConsult] = useState({
    start: "",
    end: "",
  });
  const ITEMS_PER_PAGE = 50;
  const [resource] = useResource();
  const [message, setMessage] = useState<IAlert>(initialStateAlert);
  const { user } = useContext(AuthContext);
  const [priceC, setPriceC] = useState(0);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [cantFacts, setCantFacts] = useState(0);
  const [exportXML, setExportXML] = useState([]);

  const onSorting = (field: string, order: string) =>
    setSorting({ field, order });

  const handleChange = (e: InputChange) => {
    setMessage(initialStateAlert);
    setConsult({ ...consult, [e.target.name]: e.target.value });
  };

  const listAreas = async () => {
    const res = await getAreas();
    const filter = res.data.map((area: any) => {
      return {
        _id: area._id,
        name: area.name,
        checked: area.name === user.area.name ? true : false,
      };
    });
    setAreas(filter);
  };

  const goSearch = async () => {
    setLoading(false);
    setNote("Calculando ganancias...");
    if (resource.canRead) {
      setCurrentPage(1);
      const { start, end } = consult;
      const res = await getFactByRange(start, end);
      const filter = res.data.map((fact: any) => {
        return {
          _id: fact._id,
          cod_fact: fact.cod_fact,
          createdAt: fact.createdAt,
          client: fact.client.name + " " + fact.client.lastname,
          user: fact.user.name + " " + fact.user.lastname,
          area: fact.user.area,
          payment_type: fact.payment_type,
          way_to_pay: fact.way_to_pay,
          subtotal: fact.subtotal - fact.discount,
          discount: fact.discount,
          status: fact.status,
          customer_payment: fact.customer_payment,
        };
      });

      const allPriceC = filter.map(async (flts: any) => {
        const details = await getDetailsFacts(flts._id);
        return details.data.reduce(
          (previousValue: any, currentValue: any) =>
            currentValue.product.price_c === undefined
              ? previousValue + 0 * currentValue.quantity
              : previousValue +
                currentValue.product.price_c * currentValue.quantity,

          0
        );
      });

      Promise.all(allPriceC)
        .then((values) => {
          const allPrice = values.reduce(
            (previousValue: any, currentValue: any) =>
              previousValue + currentValue,

            0
          );
          setPriceC(allPrice);
        })
        .catch((reason) => {
          console.log(reason);
        })
        .finally(() => {
          setLoading(true);
          setNote("");
        });

      setFacts(filter);
    } else {
      setMessage({
        type: "danger",
        message: `No tienes acceso a este recurso.`,
      });
    }
  };

  const factsFiltered = useMemo(() => {
    let computedFacts: any = facts;

    if (areas.length > 0) {
      let filter: any[] = [];
      computedFacts.filter((fact: any) => {
        areas.map((area: any) => {
          if (fact.area === area._id && area.checked === true) {
            filter.push(fact);
          }
        });
      });
      computedFacts = filter.length > 0 ? filter : [];
    }

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

    setCantFacts(computedFacts.length);
    setExportXML(computedFacts);

    if (resource.canRead)
      return computedFacts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        (currentPage - 1) * ITEMS_PER_PAGE + ITEMS_PER_PAGE
      );
    else return [];
  }, [facts, sorting, currentPage, resource.canRead, areas]);

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

  const calSumTotal = () => {
    return factsFiltered.reduce(
      (previousValue: any, currentValue: any) =>
        previousValue + currentValue.subtotal,

      0
    );
  };

  useEffect(() => {
    listAreas();
  }, []);

  const headerXML = headers.map((head) => {
    return {
      label: head.name,
      key: head.field,
    };
  });

  // {facts.length >= ITEMS_PER_PAGE
  //   ? facts.length
  //   : factsFiltered.length}

  const dataXML = exportXML.map((fact: any, i: number) => {
    return {
      ...fact,
      item: i + 1,
    };
  });

  return (
    <Card>
      <FactForm
        show={show}
        byConsult={true}
        closeModal={closeModal}
        fact={state}
      />
      <Card.Header as="h5">Consulta de ventas</Card.Header>
      <Card.Body>
        {message.type && (
          <Alert variant={message.type}>{message.message}</Alert>
        )}
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
        <Row>
          <Col>
            <Form.Group md="4" as={Col} controlId="formTotalC">
              <Form.Label>
                Total de precio venta S/{formatter.format(calSumTotal())}
              </Form.Label>
            </Form.Group>

            <Form.Group md="4" as={Col} controlId="formTotalV">
              <Form.Label>
                Inversión a precio costo S/{formatter.format(priceC)}
              </Form.Label>
            </Form.Group>

            {loading ? (
              <Form.Group md="4" as={Col} controlId="formTotalC">
                <Form.Label
                  style={
                    calSumTotal() - priceC <= 0
                      ? { color: "red" }
                      : { color: "green" }
                  }
                >
                  Ganancia es de S/{formatter.format(calSumTotal() - priceC)}
                </Form.Label>
              </Form.Group>
            ) : (
              note
            )}
          </Col>
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
              Se encontraron un total de {cantFacts} registros
            </span>
          </div>
        </div>
        <Row className="mb-3">
          {areas.map((area: any) => {
            return (
              <Form.Group
                key={area._id}
                md="4"
                as={Col}
                controlId={`formBasicCheckbox${area.name}`}
              >
                <ItemCheck
                  area={area}
                  areas={areas}
                  setAreas={setAreas}
                  facts={facts}
                />
              </Form.Group>
            );
          })}
        </Row>

        {resource.canRead && (
          <>
            <Form.Group
              style={{
                display: "flex",
                justifyContent: "flex-end",
              }}
              //className={styles.contentButtons__excel__input}
            >
              <CSVLink
                data={dataXML}
                headers={headerXML}
                filename="reporte-ventas.csv"
                target="_blank"
                separator={";"}
              >
                <Form.Label
                  className="btn btn-success"
                  style={{ cursor: "pointer" }}
                >
                  Exportar a excel
                </Form.Label>
              </CSVLink>
            </Form.Group>

            <Table striped bordered hover responsive>
              <TableHeader headers={headers} onSorting={onSorting} />
              <tbody>
                {factsFiltered.map((fact: any, i: number) => (
                  <FactListActives
                    key={fact._id}
                    item={i}
                    fact={fact}
                    openModalRE={openModalRE}
                    noDelete={true}
                  />
                ))}
              </tbody>
            </Table>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default ConsultFactScreen;
