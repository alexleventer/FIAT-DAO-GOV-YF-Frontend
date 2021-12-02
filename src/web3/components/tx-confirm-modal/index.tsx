import React from 'react';
import * as Antd from 'antd';

import Form from 'components/antd/form';
import Modal, { ModalProps } from 'components/antd/modal';
import GasFeeList from 'components/custom/gas-fee-list';
import Grid from 'components/custom/grid';

export type ConfirmTxModalArgs = {
  gasPrice: number;
};

type FormValues = {
  gasPrice?: {
    value: number;
  };
};

type ChildrenProps = {
  form: Antd.FormInstance;
  submitting: boolean;
};

type Props = ModalProps & {
  header?: React.ReactNode;
  submitText: string;
  children?: (props: ChildrenProps) => React.ReactNode;
  onConfirm: <A extends ConfirmTxModalArgs>(args: A) => Promise<void>;
};

const TxConfirmModal: React.FC<Props> = props => {
  const { header, submitText, children, onConfirm, ...modalProps } = props;

  const [form] = Antd.Form.useForm<FormValues>();
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  async function handleSubmit(values: FormValues) {
    const { gasPrice } = values;

    if (!gasPrice) {
      return;
    }

    setSubmitting(true);

    try {
      await onConfirm({
        ...values,
        gasPrice: gasPrice.value,
      });
      props.onCancel?.();
    } catch {}

    setSubmitting(false);
  }

  return (
    <Modal width={560} {...modalProps}>
      <Form form={form} validateTrigger={['onSubmit']} onFinish={handleSubmit}>
        {header && (
          <>
            {header}
            {/*<Divider className={s.divider} />*/}
          </>
        )}
        <Grid flow="row" gap={32}>
          {children?.({ form, submitting })}

          <Form.Item
            name="gasPrice"
            label="Gas Fee (Gwei)"
            colon={false}
            rules={[{ required: true, message: 'Required' }]}>
            <GasFeeList disabled={submitting} />
          </Form.Item>

          <button type="submit" className="button-primary" disabled={submitting}>
            {submitText}
          </button>
        </Grid>
      </Form>
    </Modal>
  );
};

export default TxConfirmModal;
