import React, { useId } from 'react';
import { Button, FormField, Input } from '@/components/common';
import { Textarea } from '@/components/common/Textarea';
import { ITypeBlock } from '@/app/(auth)/my-board/[tab]/(story-board)/_components/TypeBlock/types';

const ContentRender: React.FC<ITypeBlock> = ({ data, onChange, control, isEdit }: ITypeBlock) => {
    const id = useId();
    const handleRemoveTitle = () => onChange({ title: undefined });
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => onChange({ title: e.target.value });
    const handleContentChange = (value: string) => onChange({ contents: value });

    return (
        <div className="item-form">
            {isEdit ? (
                <>
                    {data.title !== undefined && (
                        <div className="wrap-form">
                            <FormField
                                control={control}
                                name="title"
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        id={id}
                                        maxLength={20}
                                        placeholder="제목을 입력하세요."
                                        value={data.title}
                                        onChange={handleTitleChange}
                                    />
                                )}
                            />
                            <Button
                                type="button"
                                color="line"
                                size="small"
                                icon="minus"
                                className="btn-remove"
                                onClick={handleRemoveTitle}
                            >
                                <span className="screen_out">삭제</span>
                            </Button>
                        </div>
                    )}
                    <div className="wrap-form">
                        <FormField
                            control={control}
                            name="contents"
                            render={({ field }) => {
                                const { ref, ...restField } = field;
                                return (
                                    <Textarea
                                        {...restField}
                                        maxLength={1000}
                                        placeholder="내용을 입력하세요."
                                        value={data.contents}
                                        onChange={handleContentChange}
                                    />
                                );
                            }}
                        />
                    </div>
                </>
            ) : (
                <>
                    <div className="wrap-form">
                        <strong className="subtitle-type2">{data.title}</strong>
                    </div>
                    <div className="wrap-form">
                        <p
                            className="text-type4"
                            dangerouslySetInnerHTML={{ __html: data.contents?.replaceAll('\n', '<br />') ?? '' }}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default ContentRender;